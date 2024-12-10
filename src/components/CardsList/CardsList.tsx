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

import { ActionableNotification, Button } from '@carbon/react';
import { Add, ChevronDown } from '@carbon/react/icons';
import {
  ComponentProps,
  PropsWithChildren,
  ReactElement,
  useState,
} from 'react';
import classes from './CardsList.module.scss';
import { useFetchNextPageInView } from '@/hooks/useFetchNextPageInView';
import { SearchInput } from '../AdminView/SearchInput';
import { Tooltip } from '../Tooltip/Tooltip';
import {
  OrderBySelect,
  OrderBySelectProps,
} from '../OrderBySelect/OrderBySelect';
import { useDataResultState } from '@/hooks/useDataResultState';
import { isString } from 'lodash';

interface OrderBy {
  order?: string;
  orderBy?: string;
}

export type OrderByNamed<T extends OrderBy> = T & { label: string };

interface Props<T extends OrderBy> {
  heading?: string;
  totalCount: number;
  hasNextPage?: boolean;
  isFetching: boolean;
  noItemsInfo?: string | ReactElement;
  noItemsDescr?: string;
  error: Error | null;
  errorTitle?: string;
  useViewMoreButton?: boolean;
  searchPlaceholder?: string;
  newButtonProps?: NewButtonProps;
  orderByProps?: OrderBySelectProps<T>;
  onRefetch: () => void;
  onFetchNextPage: () => void;
  onSearchChange?: (search: string) => void;
}

export function CardsList<T extends OrderBy>({
  heading,
  totalCount,
  hasNextPage,
  isFetching,
  noItemsInfo = 'No items found.',
  noItemsDescr,
  error,
  errorTitle = 'Failed to load items',
  useViewMoreButton,
  searchPlaceholder,
  newButtonProps,
  orderByProps,
  onFetchNextPage,
  onRefetch,
  onSearchChange,
  children,
}: PropsWithChildren<Props<T>>) {
  const [search, setSearch] = useState<string | null>(null);

  const { ref: fetchMoreAnchorRef } = useFetchNextPageInView({
    onFetchNextPage,
    isFetching,
    hasNextPage,
  });

  const { noResults, isEmpty } = useDataResultState({
    totalCount,
    isFetching,
    isFiltered: Boolean(search),
  });

  return (
    <section className={classes.root}>
      {(onSearchChange || heading || orderByProps || newButtonProps) && (
        <header className={classes.header}>
          <div className={classes.heading}>
            {heading && <h2>{heading}</h2>}
            {newButtonProps && <NewButton {...newButtonProps} />}
          </div>

          {!isEmpty && (
            <div className={classes.controlBar}>
              <div className={classes.searchBar}>
                {onSearchChange && (
                  <SearchInput
                    placeholder={searchPlaceholder}
                    value={search ?? ''}
                    onChange={({ target: { value } }) => {
                      setSearch(value);
                      onSearchChange(value);
                    }}
                  />
                )}
              </div>

              {orderByProps && !isEmpty && (
                <div className={classes.order}>
                  <OrderBySelect<T> {...orderByProps} />
                </div>
              )}
            </div>
          )}
        </header>
      )}

      {!error && (isEmpty || noResults) && (
        <EmptyDataInfo
          isEmpty={isEmpty}
          noItemsDescr={noItemsDescr}
          noItemsInfo={noItemsInfo}
        />
      )}

      <div className={classes.grid}>{children}</div>

      {error != null ? (
        <ActionableNotification
          actionButtonLabel="Try again"
          title={errorTitle}
          subtitle={error.message}
          hideCloseButton
          kind="error"
          lowContrast
          onActionButtonClick={onRefetch}
        />
      ) : undefined}

      <div className={classes.viewMore}>
        {hasNextPage &&
          (useViewMoreButton ? (
            <Button
              onClick={() => onFetchNextPage()}
              kind="ghost"
              size="md"
              disabled={isFetching}
            >
              <span>View more</span>
              <ChevronDown size={20} />
            </Button>
          ) : (
            <div ref={fetchMoreAnchorRef} className={classes.anchor} />
          ))}
      </div>
    </section>
  );
}

interface NewButtonProps extends ComponentProps<typeof Button> {
  title?: string;
  tooltipContent?: string | ReactElement;
}

function NewButton({ title, tooltipContent, ...props }: NewButtonProps) {
  const button = (
    <Button
      className={classes.newButton}
      kind="secondary"
      renderIcon={Add}
      {...props}
    >
      <span>{title ?? 'Add'}</span>
    </Button>
  );

  return tooltipContent ? (
    <Tooltip content={tooltipContent} placement="left" asChild>
      {button}
    </Tooltip>
  ) : (
    button
  );
}

export function EmptyDataInfo({
  isEmpty,
  noItemsDescr,
  noItemsInfo,
}: {
  isEmpty: boolean;
  noItemsInfo?: string | ReactElement;
  noItemsDescr?: string;
}) {
  return (
    <div className={classes.empty}>
      {isEmpty ? (
        isString(noItemsInfo) ? (
          <>
            <p>{noItemsInfo}</p>
            {noItemsDescr && (
              <p className={classes.emptyDescr}>{noItemsDescr}</p>
            )}
          </>
        ) : (
          noItemsInfo
        )
      ) : (
        <p className={classes.notFound}>No results found.</p>
      )}
    </div>
  );
}
