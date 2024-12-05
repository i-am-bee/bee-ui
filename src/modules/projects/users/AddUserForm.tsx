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

import { OrganizationUser } from '@/app/api/organization-users/types';
import { createProjectUser } from '@/app/api/projects-users';
import {
  ProjectUserCreateBody,
  ProjectUserRole,
} from '@/app/api/projects-users/types';
import { UserAvatar } from '@/components/UserAvatar/UserAvatar';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useUserProfile } from '@/store/user-profile';
import { Button, ComboBox } from '@carbon/react';
import { Add, Checkmark } from '@carbon/react/icons';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import classes from './AddUserForm.module.scss';
import { ProjectRoleDropdown } from './ProjectRoleDropdown';
import { projectUsersQuery, readProjectUserQuery, usersQuery } from './queries';

export function AddUserForm() {
  const htmlId = useId();
  const { project, organization } = useAppContext();
  const userId = useUserProfile((state) => state.id);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { data } = useInfiniteQuery({
    ...usersQuery(organization.id, { search }),
    enabled: search.length > 2,
  });
  const users = useMemo(
    () => data?.users.filter((user) => user.id !== userId),
    [data?.users, userId],
  );

  const { mutateAsync } = useMutation({
    mutationFn: (body: ProjectUserCreateBody) =>
      createProjectUser(organization.id, project.id, body),
    onSuccess: () => {
      setSearch('');
      reset();
      queryClient.invalidateQueries({
        queryKey: projectUsersQuery(organization.id, project.id).queryKey,
      });
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting, isValid },
  } = useForm<FormValues>({
    defaultValues: { role: 'reader', user: null },
  });

  const debouncedSetSearch = useMemo(() => debounce(setSearch, 200), []);

  const selectedUser = watch('user');

  const { data: projectUser, isPending: isCheckingMemberStatus } = useQuery({
    ...readProjectUserQuery(
      organization.id,
      project.id,
      selectedUser?.id ?? '',
    ),
    retry: false,
    enabled: Boolean(selectedUser),
    meta: { errorToast: false },
  });

  const isMember = Boolean(projectUser);

  useEffect(() => {
    if (selectedUser && !isCheckingMemberStatus && !isMember) {
      buttonRef.current?.focus();
    }
  }, [isCheckingMemberStatus, isMember, selectedUser]);

  return (
    <div className={classes.root}>
      <div className={classes.selectWrapper}>
        <Controller
          control={control}
          name="user"
          rules={{ required: true }}
          render={({ field: { onChange, value, ref } }) => (
            <ComboBox
              id={htmlId}
              titleText="Select users to share with"
              className={classes.select}
              items={users ?? []}
              onChange={({
                selectedItem,
              }: {
                selectedItem?: OrganizationUser | null;
              }) => onChange(selectedItem ?? null)}
              itemToString={userToString}
              itemToElement={(item) => (
                <div className={classes.option}>
                  <UserAvatar name={item.name} />
                  {userToString(item)}
                </div>
              )}
              onInputChange={(inputValue: string) => {
                debouncedSetSearch(inputValue);
                if (value && userToString(value) !== inputValue)
                  onChange(undefined);
              }}
              ref={ref}
              placeholder="Add users by name or email"
            />
          )}
        />

        {selectedUser && !isMember && (
          <Controller
            control={control}
            name="role"
            rules={{ required: true }}
            render={({ field: { onChange, value, ref } }) => (
              <ProjectRoleDropdown
                role={value}
                className={classes.roles}
                onChange={onChange}
              />
            )}
          />
        )}
      </div>
      <Button
        kind="secondary"
        disabled={
          !isValid || isSubmitting || isMember || isCheckingMemberStatus
        }
        onClick={handleSubmit(async ({ user, role }) => {
          if (user) {
            await mutateAsync({ role, user_id: user.id });
          }
        })}
        renderIcon={!isMember ? Add : Checkmark}
        ref={buttonRef}
      >
        {!isMember ? 'Add' : 'Added'}
      </Button>
    </div>
  );
}

interface FormValues {
  user: OrganizationUser | null;
  role: ProjectUserRole;
}

function userToString(user: OrganizationUser | null) {
  return user ? `${user.name} (${user.email})` : '';
}
