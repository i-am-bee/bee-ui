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
import { DateTime } from '@/components/DateTime/DateTime';
import { InlineEditableField } from '@/components/InlineEditableField/InlineEditableField';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useFetchNextPageInView } from '@/hooks/useFetchNextPageInView';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { truncateCenter } from '@/utils/strings';
import {
  Button,
  DataTable,
  DataTableSkeleton,
  OverflowMenu,
  OverflowMenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
} from '@carbon/react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useId, useMemo } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import {
  PreferencesLayout,
  PreferencesSection,
} from '../preferences/PreferencesLayout';
import { apiKeysQuery } from './api/queries';
import { useRenameApiKey } from './api/useRenameApiKey';
import classes from './ApiKeysHome.module.scss';
import { ApiKeyModal } from './manage/ApiKeyModal';

export function ApiKeysHome() {
  const id = useId();
  const { project } = useAppContext();
  const { openModal } = useModal();
  const [search, setSearch] = useDebounceValue('', 200);

  const { data, isPending, fetchNextPage, isFetching, hasNextPage } =
    useInfiniteQuery(apiKeysQuery({ search, limit: PAGE_SIZE }));

  const { ref: fetchMoreAnchorRef } = useFetchNextPageInView({
    onFetchNextPage: fetchNextPage,
    isFetching,
    hasNextPage,
  });

  const { mutate: mutateRename } = useRenameApiKey({});

  const rows = useMemo(
    () =>
      data?.apiKeys?.map((item, index) => {
        const { id, name, secret, created_at, last_used_at, project } = item;
        return {
          id,
          name: (
            <InlineEditableField
              defaultValue={name}
              required
              onConfirm={(value) =>
                mutateRename({ id, projectId: project.id, name: value })
              }
            />
          ),
          secret: truncateCenter(secret, 11, '***'),
          project: project.name,
          created_at: <DateTime date={created_at} />,
          last_used_at: last_used_at ? (
            <DateTime date={last_used_at} />
          ) : (
            'never'
          ),
          actions: (
            <OverflowMenu size="sm">
              <OverflowMenuItem
                itemText={
                  <Tooltip
                    content="Recreates the API key"
                    asChild
                    // TODO: disable regenerate on keys of other users
                    placement="top"
                  >
                    <span className={classes.regenerateBtnContent}>
                      Regenerate
                    </span>
                  </Tooltip>
                }
                onClick={() =>
                  openModal((props) => (
                    <ApiKeyModal.Regenerate apiKey={item} {...props} />
                  ))
                }
              />
              <OverflowMenuItem
                isDelete
                itemText="Delete"
                onClick={() =>
                  openModal((props) => (
                    <ApiKeyModal.Delete apiKey={item} {...props} />
                  ))
                }
              />
            </OverflowMenu>
          ),
        };
      }) ?? [],
    [data?.apiKeys, mutateRename, openModal],
  );

  return (
    <PreferencesLayout section={PreferencesSection.ApiKeys}>
      <div className={classes.root}>
        <p>
          Your API key is sensitive information and should not be shared with
          anyone. Keep it secure to prevent unauthorized access to your account.
        </p>

        <DataTable headers={HEADERS} rows={rows}>
          {({
            rows,
            headers,
            getHeaderProps,
            getRowProps,
            getTableProps,
            getToolbarProps,
          }: any) => (
            <div className={classes.table}>
              <TableToolbar {...getToolbarProps()} aria-label="toolbar">
                <TableToolbarContent>
                  <TableToolbarSearch
                    id={`${id}__table-search`}
                    placeholder="Search input text"
                    onChange={(e) => e && setSearch(e.target.value)}
                  />
                  <div className={classes.toolbarButtons}>
                    <Button
                      kind="secondary"
                      onClick={() =>
                        openModal((props) => (
                          <ApiKeyModal {...props} project={project} />
                        ))
                      }
                    >
                      Create API key
                    </Button>
                  </div>
                </TableToolbarContent>
              </TableToolbar>
              {isPending ? (
                <DataTableSkeleton
                  headers={HEADERS}
                  aria-label="Instances table"
                  showToolbar={false}
                  showHeader={false}
                  className={classes.table}
                  rowCount={PAGE_SIZE}
                />
              ) : (
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header: any) => {
                        const { key, ...headerProps } = getHeaderProps({
                          header,
                          isSortable: header.isSortable,
                        });
                        return (
                          <TableHeader key={key} {...headerProps}>
                            {header.header}
                          </TableHeader>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row: any, index: number) => {
                      const { key, ...rowProps } = getRowProps({ row });

                      return (
                        <TableRow key={key} {...rowProps}>
                          {row.cells.map((cell: any) => (
                            <TableCell key={cell.id}>{cell.value}</TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
              {hasNextPage && (
                <div ref={fetchMoreAnchorRef} className={classes.anchor} />
              )}
            </div>
          )}
        </DataTable>
      </div>
    </PreferencesLayout>
  );
}

const PAGE_SIZE = 10;

const HEADERS = [
  { key: 'name', header: 'Name' },
  { key: 'secret', header: 'API Key' },
  { key: 'project', header: 'Workspace' },
  { key: 'created_at', header: 'Created' },
  { key: 'last_used_at', header: 'Last used' },
  { key: 'actions', header: '' },
];
