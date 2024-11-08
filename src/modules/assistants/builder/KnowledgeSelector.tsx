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

import {
  ListVectorStoresResponse,
  VectorStore,
  VectorStoreCreateResponse,
} from '@/app/api/vector-stores/types';
import { Dropdown } from '@/components/Dropdown/Dropdown';
import { Link } from '@/components/Link/Link';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { CreateKnowledgeModal } from '@/modules/knowledge/create/CreateKnowledgeModal';
import { vectorStoresQuery } from '@/modules/knowledge/queries';
import {
  ActionableNotification,
  Button,
  DropdownSkeleton,
} from '@carbon/react';
import { ArrowUpRight } from '@carbon/react/icons';
import {
  InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { produce } from 'immer';
import { useState } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import { AssistantFormValues } from './AssistantBuilderProvider';
import classes from './KnowledgeSelector.module.scss';
import { getStaticToolName } from '@/modules/tools/hooks/useToolInfo';

interface Props {}

export function KnowledgeSelector({}: Props) {
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

  const { data, isFetching } = useInfiniteQuery(
    vectorStoresQuery(project.id, VECTOR_STORES_QUERY_PARAMS),
  );

  const vectorStore = data?.stores.find((item) => item.id === value);

  return (
    <div className={classes.root}>
      {data?.stores && (
        <div className={classes.select}>
          <Dropdown<VectorStore>
            label="Connect to a knowledge base"
            placeholder="Choose an existing base or create new"
            items={data.stores}
            size="lg"
            itemToString={(option: KnowledgeOption) =>
              option === 'new' ? 'Create new' : (option?.name ?? '')
            }
            onChange={(item: VectorStore | null) =>
              item ? handleConnectKnowledge(item.id) : handleClearKnowledge()
            }
            selected={vectorStore ?? null}
            disabled={isProjectReadOnly}
            hideClearButton={isProjectReadOnly}
            footer={
              <Button
                kind="ghost"
                className={classes.createNewButton}
                onClick={() =>
                  openModal((props) => (
                    <CreateKnowledgeModal
                      projectId={project.id}
                      onCreateVectorStore={onCreateSuccess}
                      onSuccess={handleInvalidateData}
                      {...props}
                    />
                  ))
                }
                renderIcon={ArrowUpRight}
              >
                Create new
              </Button>
            }
          />
          {vectorStore && (
            <Link
              href={`/${project.id}/knowledge/${vectorStore.id}`}
              className={classes.knowledgeBaseLink}
            >
              <Button kind="ghost" renderIcon={ArrowUpRight}>
                Manage knowledge base
              </Button>
            </Link>
          )}
        </div>
      )}

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

type KnowledgeOption = VectorStore | 'new' | null;

const VECTOR_STORES_LIMIT = 100;

const VECTOR_STORES_QUERY_PARAMS = { limit: VECTOR_STORES_LIMIT };

const KNOWLEDGE_TOOLS = [
  { id: 'code_interpreter', type: 'code_interpreter' } as const,
  { id: 'read_file', type: 'system' } as const,
  { id: 'file_search', type: 'file_search' } as const,
];
