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

'use client';
import { Thread } from '@/app/api/threads/types';
import { useInfiniteQuery } from '@tanstack/react-query';
import { HTMLAttributes, memo } from 'react';
import { PAGE_SIZE, threadsQuery } from './queries';
import { ThreadItem } from './ThreadItem';
import classes from './ThreadsHistory.module.scss';
import { useFetchNextPageInView } from '@/hooks/useFetchNextPageInView';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props extends HTMLAttributes<HTMLElement> {
  enableFetch: boolean;
}

export const ThreadsHistory = memo(function ThreadsHistory({
  enableFetch,
  className,
}: Props) {
  const { project, organization } = useProjectContext();

  const {
    data,
    error,
    hasNextPage,
    fetchNextPage,
    refetch,
    isFetching,
    isPending,
    isFetchingNextPage,
  } = useInfiniteQuery({
    ...threadsQuery(organization.id, project.id),
    enabled: enableFetch,
  });

  const { ref: fetchMoreAnchorRef } = useFetchNextPageInView({
    onFetchNextPage: fetchNextPage,
    isFetching,
    hasNextPage,
  });

  return (
    <nav className={className}>
      <ThreadsList
        threads={data}
        error={error}
        isLoading={isPending || isFetchingNextPage}
        hasNextPage={hasNextPage}
        refetch={refetch}
        fetchMoreAnchorRef={fetchMoreAnchorRef}
      />
    </nav>
  );
});

function ThreadsList({
  threads,
  error,
  isLoading,
  hasNextPage,
  refetch,
  fetchMoreAnchorRef,
}: {
  threads?: Thread[];
  error: Error | null;
  isLoading: boolean;
  hasNextPage: boolean;
  refetch: () => void;
  fetchMoreAnchorRef: (node?: Element | null) => void;
}) {
  if (!threads?.length && !isLoading && error == null) {
    return <p className={classes.noHistory}>No session history yet.</p>;
  }

  return (
    <>
      <ul className={classes.list}>
        {threads?.map((thread) => (
          <ThreadItem key={thread.id} thread={thread} />
        ))}

        {isLoading &&
          Array.from({ length: PAGE_SIZE }, (_, i) => (
            <ThreadItem.Skeleton key={i} />
          ))}

        {error != null && <ThreadItem.Error error={error} refetch={refetch} />}
      </ul>

      {hasNextPage && <div ref={fetchMoreAnchorRef} />}
    </>
  );
}
