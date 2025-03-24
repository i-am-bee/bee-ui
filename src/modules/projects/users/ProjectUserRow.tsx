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

import { ProjectUserResponse } from '@/app/api/projects-users/types';
import { UserAvatar } from '@/components/UserAvatar/UserAvatar';
import { useUserProfile } from '@/store/user-profile';
import { SkeletonPlaceholder, SkeletonText } from '@carbon/react';
import clsx from 'clsx';
import { ProjectRoleDropdown } from './ProjectRoleDropdown';
import classes from './ProjectUserRow.module.scss';
import { useDeleteProjectUser } from './api/mutations/useDeleteProjectUser';
import { useUpdateProjectUser } from './api/mutations/useUpdateProjectUser';

interface Props {
  user: ProjectUserResponse;
}

export function ProjectUserRow({ user }: Props) {
  const userId = useUserProfile((state) => state.id);

  const { mutateAsync: deleteProjectUser, isPending: isDeletePending } =
    useDeleteProjectUser();
  const { mutateAsync: updateProjectUser } = useUpdateProjectUser();

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
        onChange={(role) => updateProjectUser({ id: user.id, body: { role } })}
        onDelete={() => {
          deleteProjectUser(user.id);
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
