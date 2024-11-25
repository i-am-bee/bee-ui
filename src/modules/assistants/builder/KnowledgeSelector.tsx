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

import { MAX_API_FETCH_LIMIT } from '@/app/api/utils';
import {
  ListVectorStoresResponse,
  VectorStore,
  VectorStoreCreateResponse,
} from '@/app/api/vector-stores/types';
import { DropdownSelector } from '@/components/DropdownSelector/DropdownSelector';
import { Link } from '@/components/Link/Link';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { CreateKnowledgeModal } from '@/modules/knowledge/create/CreateKnowledgeModal';
import { KnowledgeFileCard } from '@/modules/knowledge/detail/KnowledgeFileCard';
import { useVectorStores } from '@/modules/knowledge/hooks/useVectorStores';
import {
  vectorStoresFilesQuery,
  vectorStoresQuery,
} from '@/modules/knowledge/queries';
import { getStaticToolName } from '@/modules/tools/hooks/useToolInfo';
import { ActionableNotification, DropdownSkeleton } from '@carbon/react';
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { produce } from 'immer';
import pluralize from 'pluralize';
import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { AssistantFormValues } from './AssistantBuilderProvider';
import { BuilderSectionHeading } from './BuilderSectionHeading';
import classes from './KnowledgeSelector.module.scss';

export function KnowledgeSelector() {
  const { openModal } = useModal();
  const { project, isProjectReadOnly } = useAppContext();
  const {
    field: { value, onChange },
  } = useController<AssistantFormValues, 'vectorStoreId'>({
    name: 'vectorStoreId',
  });
  const { setValue, getValues } = useFormContext<AssistantFormValues>();
  const queryClient = useQueryClient();
  const [autoEnabledToolNames, setAutoEnabledToolNames] = useState<string[]>(
    [],
  );
  const autoEnabledToolNamesString = new Intl.ListFormat('en').format(
    autoEnabledToolNames,
  );

  const handleConnectKnowledge = (id: string) => {
    onChange(id);

    const selectedTools = getValues('tools');
    const knowledgeToolsToEnable = KNOWLEDGE_TOOLS.filter(
      (tool) =>
        !selectedTools.some(
          ({ id, type }) => tool.type === type && tool.id === id,
        ),
    );

    if (knowledgeToolsToEnable.length > 0) {
      setValue('tools', [...selectedTools, ...knowledgeToolsToEnable], {
        shouldValidate: true,
      });

      setAutoEnabledToolNames(knowledgeToolsToEnable.map(getStaticToolName));
    }
  };

  const handleClearKnowledge = () => {
    onChange(null);
    setAutoEnabledToolNames([]);
  };

  const onCreateSuccess = (response: VectorStoreCreateResponse) => {
    if (!response) return;

    handleConnectKnowledge(response.id);

    queryClient.setQueryData<InfiniteData<ListVectorStoresResponse>>(
      vectorStoresQuery(project.id, VECTOR_STORES_QUERY_PARAMS).queryKey,
      produce((draft) => {
        if (!draft?.pages) return null;
        const pageFirst = draft?.pages.at(0);
        pageFirst && pageFirst.data.unshift(response);
      }),
    );

    queryClient.invalidateQueries({
      queryKey: [vectorStoresQuery(project.id).queryKey.at(0)],
    });
  };

  const handleInvalidateData = () => {
    queryClient.invalidateQueries({
      queryKey: vectorStoresQuery(project.id, VECTOR_STORES_QUERY_PARAMS)
        .queryKey,
    });
  };

  const { data, isFetching } = useVectorStores({
    params: VECTOR_STORES_QUERY_PARAMS,
  });

  const { data: dataFiles } = useInfiniteQuery({
    ...vectorStoresFilesQuery(
      project.id,
      value ?? '',
      VECTOR_STORE_FILES_QUERY_PARAMS,
    ),
    enabled: Boolean(value),
  });

  const vectorStore = data?.stores.find((item) => item.id === value);

  return (
    <div className={classes.root}>
      <BuilderSectionHeading
        title="Knowledge"
        buttonProps={{
          children: 'New knowledge base',
          onClick: () =>
            openModal((props) => (
              <CreateKnowledgeModal
                projectId={project.id}
                onCreateVectorStore={onCreateSuccess}
                onSuccess={handleInvalidateData}
                {...props}
              />
            )),
          disabled: isProjectReadOnly,
        }}
      />

      {data?.stores && (
        <div className={classes.select}>
          <DropdownSelector<VectorStore>
            items={data.stores}
            onSubmit={(value) => {
              if (value === null) {
                handleClearKnowledge();
              } else {
                const selectedItem = value.at(0);
                selectedItem && handleConnectKnowledge(selectedItem.id);
              }
            }}
            selected={vectorStore}
            placeholder="Browse knowledge bases"
            itemToString={(item) => item.name}
            submitButtonTitle="Connect"
            actionBarContentLeft={
              <Link href={`/${project.id}/knowledge`} target="_blank">
                Browse knowledge library
              </Link>
            }
          />
        </div>
      )}

      {vectorStore && dataFiles?.files.length ? (
        <>
          <ul className={classes.files}>
            {dataFiles.files.map((item) => (
              <KnowledgeFileCard
                key={item.id}
                vectorStore={vectorStore}
                vectorStoreFile={item}
                kind="list"
              />
            ))}
          </ul>
          {dataFiles.totalCount &&
          dataFiles.totalCount > VECTOR_STORE_FILES_QUERY_PARAMS.limit ? (
            <p className={classes.filesMore}>
              ...and {dataFiles.totalCount - VECTOR_STORE_FILES_LIMIT} more{' '}
              {pluralize(
                'file',
                dataFiles.totalCount - VECTOR_STORE_FILES_LIMIT,
              )}
            </p>
          ) : null}
        </>
      ) : null}

      {!data && isFetching && <DropdownSkeleton />}

      {autoEnabledToolNames.length > 0 && (
        <ActionableNotification
          title={`${autoEnabledToolNamesString} enabled`}
          subtitle={`This bee will need ${autoEnabledToolNamesString} in order to perform file-related tasks, including those involving the knowledge base (if applicable) and any files uploaded during a session.`}
          kind="info"
          lowContrast
          onCloseButtonClick={() => setAutoEnabledToolNames([])}
        />
      )}
    </div>
  );
}

const VECTOR_STORES_QUERY_PARAMS = { limit: MAX_API_FETCH_LIMIT };
const VECTOR_STORE_FILES_LIMIT = 3;
const VECTOR_STORE_FILES_QUERY_PARAMS = { limit: VECTOR_STORE_FILES_LIMIT };

const KNOWLEDGE_TOOLS = [
  { id: 'code_interpreter', type: 'code_interpreter' } as const,
  { id: 'read_file', type: 'system' } as const,
  { id: 'file_search', type: 'file_search' } as const,
];
