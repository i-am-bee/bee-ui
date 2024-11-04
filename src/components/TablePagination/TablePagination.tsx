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

import { IconButton, SkeletonText } from '@carbon/react';
import classes from './TablePagination.module.scss';
import { CaretLeft, CaretRight } from '@carbon/react/icons';
import clsx from 'clsx';

interface Props {
  page: number;
  pageSize: number;
  totalCount: number;
  onNextPage: () => void;
  onPreviousPage: () => void;
  isFetching?: boolean;
  ariaLabel?: string;
}

export function TablePagination({
  page,
  pageSize,
  totalCount,
  isFetching,
  ariaLabel,
  onNextPage,
  onPreviousPage,
}: Props) {
  return (
    <div
      className={classes.root}
      aria-label={ariaLabel ?? 'Table pagination bar'}
    >
      {isFetching ? (
        <div className={clsx(classes.count, classes.countSkeleton)}>
          <SkeletonText />
        </div>
      ) : (
        <div className={classes.count}>
          {Math.min(page * pageSize, totalCount)} -{' '}
          {Math.min((page + 1) * pageSize - 1, totalCount)} of {totalCount}{' '}
          items
        </div>
      )}
      <div className={classes.buttons}>
        <IconButton
          label="Previous page"
          kind="ghost"
          size="lg"
          disabled={isFetching || page <= 1}
          onClick={() => onPreviousPage()}
        >
          <CaretLeft />
        </IconButton>
        <IconButton
          label="Next page"
          kind="ghost"
          size="lg"
          disabled={isFetching || page * pageSize >= totalCount}
          onClick={() => onNextPage()}
        >
          <CaretRight />
        </IconButton>
      </div>
    </div>
  );
}
