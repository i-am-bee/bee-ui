/**
 * Copyright 2024 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Tool, ToolReference } from '@/app/api/tools/types';
import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { isNotNull } from '@/utils/helpers';
import { ArrowRight, ArrowUpRight, Edit } from '@carbon/react/icons';
import clsx from 'clsx';
import Markdown, { Components } from 'react-markdown';
import { ToolTypeTag } from '../assistants/tools/ToolTypeTag';
import { useDeleteTool } from './hooks/useDeleteTool';
import { useToolInfo } from './hooks/useToolInfo';
import { PublicToolModal } from './manage/PublicToolModal';
import { UserToolModal } from './manage/UserToolModal';
import classes from './ToolCard.module.scss';
import { getToolReferenceFromTool } from './utils';
import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { ProjectProvider } from '@/layout/providers/ProjectProvider';

interface Props {
  tool: Tool;
  onDeleteSuccess: (tool: Tool) => void;
  onSaveSuccess?: () => void;
}

export function ToolCard({ tool, onDeleteSuccess, onSaveSuccess }: Props) {
  const { name, description, user_description, type } = tool;
  const { deleteTool, isPending: isDeletePending } = useDeleteTool({
    tool,
    onSuccess: () => onDeleteSuccess(tool),
  });
  const { isProjectReadOnly, project, organization } = useAppContext();
  const { openModal } = useModal();

  const toolDescription =
    type === 'user'
      ? description
      : (tool.uiMetadata.description_short ?? user_description);

  return (
    <>
      <CardsListItem
        className={classes.root}
        title={name ?? ''}
        icon={
          <ToolIcon
            organization={organization}
            project={project}
            tool={getToolReferenceFromTool(tool)}
          />
        }
        onClick={() =>
          openModal((props) => (
            <ProjectProvider project={project} organization={organization}>
              {tool.type === 'user' ? (
                isProjectReadOnly ? (
                  <UserToolModal.View tool={tool} {...props} />
                ) : (
                  <UserToolModal
                    {...props}
                    tool={tool}
                    onDeleteSuccess={onDeleteSuccess}
                    onSaveSuccess={onSaveSuccess}
                  />
                )
              ) : (
                <PublicToolModal {...props} tool={tool} />
              )}
            </ProjectProvider>
          ))
        }
        isDeletePending={isDeletePending}
        cta={
          tool.type === 'user'
            ? {
                title: isProjectReadOnly ? 'View details' : 'Edit tool',
                icon: isProjectReadOnly ? ArrowRight : Edit,
              }
            : { title: 'View details', icon: ArrowUpRight }
        }
        actions={
          !isProjectReadOnly && tool.type === 'user'
            ? [
                {
                  isDelete: true,
                  itemText: 'Delete',
                  onClick: () => deleteTool(),
                },
              ].filter(isNotNull)
            : undefined
        }
      >
        <div className={classes.body}>
          {toolDescription && (
            <div className={classes.description}>
              <ToolDescription description={toolDescription} />
            </div>
          )}

          <ToolTypeTag type={tool.type} id={tool.id} />
        </div>
      </CardsListItem>
    </>
  );
}

export function ToolIcon({
  tool,
  size = 'md',
  className,
  project,
  organization,
}: {
  tool: ToolReference;
  className?: string;
  size?: 'md' | 'sm';
  organization: Organization;
  project: Project;
}) {
  const { toolIcon: Icon } = useToolInfo({
    organization,
    project,
    toolReference: tool,
  });
  return (
    <span className={clsx(classes.icon, className)} data-size={size}>
      <Icon size="20" />
    </span>
  );
}

export function ToolDescription({ description }: { description: string }) {
  return <Markdown components={TRANSFORM_COMPONENTS}>{description}</Markdown>;
}

export const TRANSFORM_COMPONENTS: Partial<Components> = {
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {props.children}
    </a>
  ),
};
