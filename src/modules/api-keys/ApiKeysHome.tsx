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
import classes from './ApiKeysHome.module.scss';
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
import { useAppContext } from '@/layout/providers/AppProvider';
import { apiKeysQuery } from './api/queries';
import { useId, useMemo } from 'react';
import { getLocaleDateString } from '@/utils/dates';
import {
  PreferencesLayout,
  PreferencesSection,
} from '../preferences/PreferencesLayout';
import { useModal } from '@/layout/providers/ModalProvider';
import { ApiKeyModal } from './manage/ApiKeyModal';
import {
  UserProfileProvider,
  useUserProfile,
} from '../chat/providers/UserProfileProvider';
import { InlineEditableField } from '@/components/InlineEditableField/InlineEditableField';
import { useRenameApiKey } from './api/useRenameApiKey';
import { truncateCenter } from '@/utils/strings';

export function ApiKeysHome() {
  const id = useId();
  const { project } = useAppContext();
  const { openModal, openConfirmation } = useModal();
  const userProfileValue = useUserProfile();

  const { data } = useInfiniteQuery(apiKeysQuery(project.id));

  const { mutate: mutateRename } = useRenameApiKey({});

  const rows = useMemo(
    () =>
      data?.apiKeys?.map((item, index) => {
        const { id, name, secret, created_at, project } = item;
        return {
          id: `${index}`,
          name: (
            <InlineEditableField
              defaultValue={name}
              onConfirm={(value) =>
                mutateRename({ id, projectId: project.id, name: value })
              }
            />
          ),
          secret: truncateCenter(secret, 11, '***'),
          project: project.name,
          created_at: (
            <time dateTime={getLocaleDateString(created_at)}>
              {getLocaleDateString(created_at, undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          ),
          actions: (
            <OverflowMenu>
              <OverflowMenuItem
                itemText="Regenerate"
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

        {!data?.apiKeys ? (
          <DataTableSkeleton
            headers={HEADERS}
            aria-label="Instances table"
            showToolbar={false}
            showHeader={false}
            className={classes.table}
            rowCount={10}
          />
        ) : (
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
                      onChange={(e) => {
                        // onSearchChange(e.target.value);
                      }}
                    />
                    <div className={classes.toolbarButtons}>
                      <Button
                        kind="secondary"
                        onClick={() =>
                          openModal((props) => (
                            <UserProfileProvider value={userProfileValue}>
                              <ApiKeyModal {...props} project={project} />
                            </UserProfileProvider>
                          ))
                        }
                      >
                        Create API key
                      </Button>
                    </div>
                  </TableToolbarContent>
                </TableToolbar>
                {/* <TableLoadingContainer isLoading={isLoading}> */}
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header: any) => (
                        <TableHeader
                          key={header.key}
                          {...getHeaderProps({
                            header,
                            isSortable: header.isSortable,
                          })}
                        >
                          {header.header}
                        </TableHeader>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row: any, index: number) => (
                      <TableRow key={row.id} {...getRowProps({ row })}>
                        {row.cells.map((cell: any) => (
                          <TableCell key={cell.id}>{cell.value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* <TablePagination aria-label="pagination bar" {...pagination} /> */}
                {/* </TableLoadingContainer> */}
              </div>
            )}
          </DataTable>
        )}
      </div>
    </PreferencesLayout>
  );
}

const HEADERS = [
  { key: 'name', header: 'Name' },
  { key: 'secret', header: 'API Key' },
  { key: 'project', header: 'Workspace' },
  { key: 'created_at', header: 'Created' },
  { key: 'actions', header: '' },
];
