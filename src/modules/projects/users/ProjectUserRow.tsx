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

import { deleteProjectUser, updateProjectUser } from '@/app/api/projects-users';
import { ProjectUser, ProjectUserRole } from '@/app/api/projects-users/types';
import { UserAvatar } from '@/components/UserAvatar/UserAvatar';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useUserProfile } from '@/store/user-profile';
import { SkeletonPlaceholder, SkeletonText } from '@carbon/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { ProjectRoleDropdown } from './ProjectRoleDropdown';
import classes from './ProjectUserRow.module.scss';
import { projectUsersQuery } from './queries';

interface Props {
  user: ProjectUser;
}

export function ProjectUserRow({ user }: Props) {
  const { project } = useAppContext();
  const userId = useUserProfile((state) => state.id);
  const queryClient = useQueryClient();

  const { mutateAsync: mutateDelete, isPending: isDeletePending } = useMutation(
    {
      mutationFn: () => deleteProjectUser(project.id, user.id),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: projectUsersQuery(project.id).queryKey,
        });
      },
      meta: {
        errorToast: {
          title: 'Failed to remove the user',
          includeErrorMessage: true,
        },
      },
    },
  );

  const { mutateAsync: mutateUpdate, isPending: isUpdatePending } = useMutation(
    {
      mutationFn: (role: ProjectUserRole) =>
        updateProjectUser(project.id, user.id, role),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: projectUsersQuery(project.id).queryKey,
        });
      },
      meta: {
        errorToast: {
          title: 'Failed to remove the user',
          includeErrorMessage: true,
        },
      },
    },
  );

  return (
    <fieldset
      key={user.id}
      className={clsx(classes.user, { [classes.isDeleting]: isDeletePending })}
      disabled={user.id === userId}
    >
      <UserAvatar name={user.name} />
      <span>
        {user.name} {user.email && <em>({user.email})</em>}
      </span>
      <ProjectRoleDropdown
        role={user.role}
        onChange={(role) => mutateUpdate(role)}
        onDelete={() => {
          mutateDelete();
          const activeElement = document.activeElement;
          if (activeElement instanceof HTMLElement) activeElement.blur();
        }}
      />
    </fieldset>
  );
}

ProjectUserRow.Skeleton = function Skeleton() {
  return (
    <fieldset className={classes.user}>
      <SkeletonPlaceholder className={classes.skeletonIcon} />
      <span className={classes.skeletonText}>
        <SkeletonText />
      </span>
      <SkeletonPlaceholder className={classes.skeletonRole} />
    </fieldset>
  );
};
