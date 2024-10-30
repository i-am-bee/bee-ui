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

import { Dropdown } from '@/components/Dropdown/Dropdown';
import { useModal } from '@/layout/providers/ModalProvider';
import { Button, SkeletonPlaceholder, Tag } from '@carbon/react';
import classes from './ProjectSelector.module.scss';
import { useAppContext } from '@/layout/providers/AppProvider';
import { Project, ProjectsListQuery } from '@/app/api/projects/types';
import { Add } from '@carbon/react/icons';
import { useRouter } from 'next-nprogress-bar';
import { useMemo } from 'react';
import { CreateProjectModal } from './manage/CreateProjectModal';
import { useProjects } from './hooks/useProjects';
import { ProjectWithScope } from './types';

interface Props {
  hideReadOnlyTag?: boolean;
}

export function ProjectSelector({ hideReadOnlyTag }: Props) {
  const { openModal } = useModal();
  const { project, isProjectReadOnly } = useAppContext();
  const router = useRouter();

  const { projects, data, isFetching } = useProjects({ withRole: true });

  const selectedItem = useMemo(
    () => projects?.find(({ id }) => id === project.id),
    [project.id, projects],
  );

  return (
    <div className={classes.root}>
      {projects && (
        <>
          <Dropdown<ProjectWithScope>
            label=""
            items={projects}
            size="md"
            hideClearButton
            itemToString={(option: Option) =>
              option === 'new' ? 'Create workspace' : (option?.name ?? '')
            }
            itemToElement={(project: ProjectWithScope) => (
              <span className={classes.option}>
                <span className={classes.optionContent}>
                  <span>{project.name}</span>
                  {project.readOnly && <ViewOnlyTag />}
                </span>
              </span>
            )}
            onChange={(item: Project | null) =>
              item && router.push(`/${item.id}`)
            }
            selected={selectedItem ?? null}
            footer={
              <Button
                kind="ghost"
                size="md"
                className={classes.createNewButton}
                renderIcon={Add}
                onClick={() =>
                  openModal((props) => <CreateProjectModal {...props} />)
                }
              >
                Create workspace
              </Button>
            }
          />
          {!hideReadOnlyTag && (
            <div className={classes.selected}>
              <div>
                <span className={classes.selectedTitle}>
                  {selectedItem?.name}
                </span>
                {isProjectReadOnly && <ViewOnlyTag />}
              </div>
            </div>
          )}
        </>
      )}

      {!data && isFetching && (
        <SkeletonPlaceholder className={classes.skeleton} />
      )}
    </div>
  );
}

type Option = Project | 'new';

export const PROJECTS_QUERY_PARAMS: ProjectsListQuery = {
  limit: 100,
  order_by: 'created_at',
  order: 'asc',
};

function ViewOnlyTag() {
  return (
    <Tag className={classes.viewOnlyTag} size="sm">
      View Only
    </Tag>
  );
}
