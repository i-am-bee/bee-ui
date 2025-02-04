/**
 * Copyright 2025 IBM Corp.
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

import { Thread, ThreadMetadata } from '@/app/api/threads/types';
import { encodeMetadata } from '@/app/api/utils';
import { getAssistantName } from '@/modules/assistants/utils';
import truncate from 'lodash/truncate';
import { useCallback } from 'react';
import { THREAD_TITLE_MAX_LENGTH } from '../history/ThreadItem';
import { getThreadVectorStoreId } from '../utils';
import { useUpdateThread } from '../api/mutations/useUpdateThread';
import { useCreateThread } from '../api/mutations/useCreateThread';
import { useFilesUpload } from '../providers/FilesUploadProvider';
import { useStateWithRef } from '@/hooks/useStateWithRef';
import { Assistant } from '@/modules/assistants/types';

interface Props {
  thread?: Thread;
  assistant: Assistant | null;
}

export function useChatThread({ thread: initialThread, assistant }: Props) {
  const [thread, setThread, threadRef] = useStateWithRef(initialThread || null);

  const { mutateAsync: updateThread } = useUpdateThread();
  const { mutateAsync: createThread } = useCreateThread();

  const { vectorStoreId, ensureThreadRef } = useFilesUpload();

  const ensureThread = useCallback(
    async (message?: string) => {
      const toolResources = vectorStoreId
        ? { file_search: { vector_store_ids: [vectorStoreId] } }
        : undefined;

      if (thread) {
        const threadMetadata = thread.uiMetadata;
        if (
          (vectorStoreId && !getThreadVectorStoreId(thread)) ||
          threadMetadata.title === ''
        ) {
          threadMetadata.title =
            threadMetadata.title === ''
              ? truncate(message, { length: THREAD_TITLE_MAX_LENGTH })
              : threadMetadata.title;

          const updatedThread = await updateThread({
            thread,
            body: {
              tool_resources: toolResources,
              metadata: encodeMetadata<ThreadMetadata>(threadMetadata),
            },
          });

          if (updatedThread) {
            setThread(updatedThread);

            return updatedThread;
          }
        }

        return thread;
      }

      const createdThread = await createThread({
        tool_resources: toolResources,
        metadata: encodeMetadata<ThreadMetadata>({
          assistantName: getAssistantName(assistant),
          assistantId: assistant?.id ?? '',
          title: truncate(message, { length: THREAD_TITLE_MAX_LENGTH }),
        }),
      });

      if (!createdThread) {
        throw Error('Thread creation failed.');
      }

      setThread(createdThread);

      return createdThread;
    },
    [assistant, createThread, updateThread, setThread, thread, vectorStoreId],
  );

  if (ensureThreadRef) ensureThreadRef.current = ensureThread;

  return {
    ensureThread,
    thread,
    threadRef,
    setThread,
  };
}
