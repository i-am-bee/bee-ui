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

import { SkeletonText } from '@carbon/react';
import pluralize from 'pluralize';
import { useProjectUsersCount } from './api/queries/useProjectUsersCount';
import classes from './UsersCount.module.scss';

export function UsersCount({ projectId }: { projectId: string }) {
  const { totalCount, isLoading } = useProjectUsersCount({ id: projectId });

  return (
    <div className={classes.root}>
      {isLoading ? (
        <SkeletonText className={classes.skeleton} />
      ) : totalCount && totalCount > 1 ? (
        <>
          {totalCount > 99 ? '99+' : totalCount}{' '}
          {pluralize('collaborator', totalCount)}
        </>
      ) : null}
    </div>
  );
}
