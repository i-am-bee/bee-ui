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

import { ToolReference } from '@/app/api/tools/types';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import classes from './ToolInfoButton.module.scss';
import { ArrowUpRight, Edit, Information } from '@carbon/react/icons';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';
import { LinkButton } from '@/components/LinkButton/LinkButton';
import { useModal } from '@/layout/providers/ModalProvider';
import { UserToolModal } from '@/modules/tools/manage/UserToolModal';
import { PublicToolModal } from '@/modules/tools/manage/PublicToolModal';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ToolDescription } from '@/modules/tools/ToolCard';

interface Props {
  toolReference: ToolReference;
}

export function ToolInfoButton({ toolReference }: Props) {
  const { isProjectReadOnly } = useAppContext();
  const { openModal } = useModal();
  const { tool } = useToolInfo({ toolReference });

  if (!tool) return;

  const toolDescription =
    tool.type === 'user'
      ? tool.description
      : (tool.uiMetadata.description_short ?? tool.user_description);

  const isEditable = tool.type === 'user' && !isProjectReadOnly;

  return (
    <Tooltip
      asChild
      content={
        <div className={classes.tooltip}>
          <span>
            <ToolDescription description={toolDescription ?? ''} />
          </span>
          <LinkButton
            as="span"
            className={classes.openDetailBtn}
            icon={isEditable ? Edit : ArrowUpRight}
            onClick={() =>
              openModal((props) => (
                <>
                  {tool.type === 'user' ? (
                    !isEditable ? (
                      <UserToolModal.View tool={tool} {...props} />
                    ) : (
                      <UserToolModal {...props} tool={tool} />
                    )
                  ) : (
                    <PublicToolModal {...props} tool={tool} />
                  )}
                </>
              ))
            }
          >
            {isEditable ? 'Edit tool' : 'View Details'}
          </LinkButton>
        </div>
      }
      placement="top"
    >
      <span className={classes.root} role="button">
        <Information />
      </span>
    </Tooltip>
  );
}
