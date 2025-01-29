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

import { useVectorStore } from '@/modules/knowledge/api/queries/useVectorStore';
import { useVectorStoreFiles } from '@/modules/knowledge/api/queries/useVectorStoreFiles';
import { VectoreStoreFileUpload } from '@/modules/knowledge/files/VectorStoreFilesUploadProvider';
import { toolsEqual } from '@/modules/tools/utils';
import { SkeletonText, Toggle } from '@carbon/react';
import clsx from 'clsx';
import pluralize from 'pluralize';
import { useId, useMemo } from 'react';
import { useChat } from '../providers/chat-context';
import { useFilesUpload } from '../providers/FilesUploadProvider';
import classes from './ThreadKnowledge.module.scss';

interface Props {
  assistantVectorStores: string[];
  threadVectorStores: string[];
  enableFetch?: boolean;
}

const fileMapper = (file: Partial<VectoreStoreFileUpload>) => ({
  id: file.file?.id,
  filename: file.file?.filename,
});

export function ThreadKnowledge({
  assistantVectorStores,
  threadVectorStores,
  enableFetch,
}: Props) {
  const id = useId();
  const { getMessages, disabledTools, setDisabledTools } = useChat();
  const { getThreadTools } = useChat();
  const { files } = useFilesUpload();

  // TODO: We don't currently support paging of messages, so this works. When pagination is available, we need to figure out the functionality differently.
  const allFiles = useMemo(
    () => [
      ...getMessages().reduce(
        (previous, current) => {
          if (current.files) {
            return [...previous, ...current.files.map(fileMapper)];
          }

          return previous;
        },
        [] as { id?: string; filename?: string }[],
      ),
      ...files.map(fileMapper),
    ],
    [files, getMessages],
  );

  const { data: assistantKnowledge, isLoading: isAssistantKnowledgeLoading } =
    useVectorStore({
      id: assistantVectorStores.at(0),
      enabled: enableFetch,
    });

  const assistantKnowledgeTotal = assistantKnowledge?.file_counts.total ?? 0;

  const {
    data: threadKnowledgeFilesData,
    isLoading: isThreadKnowledgeFilesLoading,
  } = useVectorStoreFiles({
    // We support only one vector store per thread
    storeId: threadVectorStores.at(0),
    params: { limit: VECTOR_STORES_FILES_LIMIT },
    enabled: enableFetch,
  });

  const threadKnowledgeFiles = useMemo(
    () =>
      allFiles.filter((file) =>
        threadKnowledgeFilesData?.files.some(
          (threadFile) =>
            threadFile.status === 'completed' && threadFile.id === file.id,
        ),
      ),
    [allFiles, threadKnowledgeFilesData?.files],
  );

  const fileSearchTool = useMemo(
    () => getThreadTools().find(({ type }) => type === 'file_search'),
    [getThreadTools],
  );
  const fileSearchDisabled = useMemo(
    () => disabledTools.some(({ type }) => type === 'file_search'),
    [disabledTools],
  );
  const toggled = Boolean(fileSearchTool && !fileSearchDisabled);

  return (
    <div className={classes.root}>
      <header className={classes.header}>
        <div className={classes.headerTop}>
          <h2 className={classes.heading}>Access to knowledge</h2>

          <Toggle
            id={id}
            className={classes.toggle}
            size="sm"
            toggled={toggled}
            onToggle={
              fileSearchTool
                ? () =>
                    setDisabledTools(
                      fileSearchDisabled
                        ? disabledTools.filter(
                            (t) => !toolsEqual(t, fileSearchTool),
                          )
                        : [...disabledTools, fileSearchTool],
                    )
                : undefined
            }
            disabled={!fileSearchTool}
          />
        </div>

        {fileSearchTool ? (
          <p className={classes.description}>
            Turning off access to knowledge will prevent access to both built-in
            knowledge and any files added throughout the session
          </p>
        ) : (
          <p className={clsx([classes.description, classes.empty])}>
            No knowledge connected
          </p>
        )}
      </header>

      {fileSearchTool && (
        <div className={classes.groups}>
          <div className={classes.group}>
            <h3 className={classes.subHeading}>Built-in knowledge</h3>
            {isAssistantKnowledgeLoading ? (
              <SkeletonText className={classes.value} width="" />
            ) : assistantKnowledge ? (
              <p className={classes.value}>
                {assistantKnowledge?.name} (
                {pluralize('documents', assistantKnowledgeTotal, true)})
              </p>
            ) : (
              <p className={clsx([classes.value, classes.empty])}>
                No knowledge base connected
              </p>
            )}
          </div>

          <div className={classes.group}>
            <h3 className={classes.subHeading}>Files added to session</h3>
            {isThreadKnowledgeFilesLoading ? (
              <SkeletonText className={classes.value} width="" />
            ) : threadKnowledgeFiles.length > 0 ? (
              <p className={classes.value}>
                {threadKnowledgeFiles
                  .map(({ filename }) => filename)
                  .join(', ')}
              </p>
            ) : (
              <p className={clsx([classes.value, classes.empty])}>
                No files added
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const VECTOR_STORES_FILES_LIMIT = 100;
