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

import { Modal } from '@/components/Modal/Modal';
import { useFetchNextPageInView } from '@/hooks/useFetchNextPageInView';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ModalProps } from '@/layout/providers/ModalProvider';
import {
  ActionableNotification,
  ModalBody,
  ModalHeader,
  usePrefix,
} from '@carbon/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { AddUserForm } from './AddUserForm';
import { ProjectUserRow } from './ProjectUserRow';
import { useProjectUsersQueries } from './queries';
import { useProjectUsersCount } from './useProjectUsersCount';
import classes from './UsersModal.module.scss';

export default function UsersModal(props: ModalProps) {
  const { project, role } = useAppContext();
  const prefix = usePrefix();
  const { totalCount } = useProjectUsersCount(project.id);
  const projectUsersQueries = useProjectUsersQueries();

  const {
    data,
    isLoading,
    isFetchingNextPage,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery(projectUsersQueries.list(project.id));

  const { ref: fetchMoreAnchorRef } = useFetchNextPageInView({
    onFetchNextPage: fetchNextPage,
    isFetching: isLoading || isFetchingNextPage,
    hasNextPage,
  });

  return (
    <Modal {...props} size="md" className={classes.modal}>
      <ModalHeader>
        <h2>Share the workspace “{project.name}”</h2>
      </ModalHeader>
      <ModalBody>
        <fieldset className={classes.body} disabled={role !== 'admin'}>
          <AddUserForm />

          <div>
            <label className={`${prefix}--label`}>
              Currently shared with {totalCount && `(${totalCount} users)`}
            </label>
            <div className={classes.users}>
              {data?.users?.map((user) => (
                <ProjectUserRow key={user.id} user={user} />
              ))}

              {(isLoading || isFetchingNextPage) &&
                Array.from({ length: PAGE_SIZE }, (_, i) => (
                  <ProjectUserRow.Skeleton key={i} />
                ))}

              {error != null && (
                <ActionableNotification
                  actionButtonLabel="Try again"
                  title="Failed to load users"
                  subtitle={error.message}
                  hideCloseButton
                  kind="error"
                  lowContrast
                  onActionButtonClick={refetch}
                />
              )}

              {hasNextPage && (
                <div ref={fetchMoreAnchorRef} className={classes.anchor} />
              )}
            </div>
          </div>
        </fieldset>
      </ModalBody>
    </Modal>
  );
}

const PAGE_SIZE = 10;
