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

import { ToolReference } from '@/app/api/tools/types';
import { LineClampText } from '@/components/LineClampText/LineClampText';
import { Modal } from '@/components/Modal/Modal';
import { SSRSafePortal } from '@/components/SSRSafePortal/SSRSafePortal';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { useVectorStore } from '@/modules/knowledge/hooks/useVectorStore';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';
import { ToolIcon } from '@/modules/tools/ToolCard';
import { getAssistantToolReference } from '@/modules/tools/utils';
import {
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SkeletonText,
} from '@carbon/react';
import { Edit } from '@carbon/react/icons';
import clsx from 'clsx';
import { useRouter } from 'next-nprogress-bar';
import pluralize from 'pluralize';
import { useDeleteAssistant } from '../builder/useDeleteAssistant';
import { AssistantIcon } from '../icons/AssistantIcon';
import { Assistant } from '../types';
import classes from './AssistantModal.module.scss';

export interface AssistantModalProps {
  onDeleteSuccess?: () => void;
  assistant: Assistant;
}

export default function AssistantModal({
  assistant,
  onDeleteSuccess,
  ...props
}: AssistantModalProps & ModalProps) {
  const { project, isProjectReadOnly } = useAppContext();
  const router = useRouter();

  const { deleteAssistant, isPending: isDeletePending } = useDeleteAssistant({
    assistant: assistant!,
    onSuccess: async () => {
      onDeleteSuccess?.();
    },
  });

  const vectorStoreId =
    assistant.tool_resources?.file_search?.vector_store_ids?.at(0);
  const { data: vectorStore } = useVectorStore(vectorStoreId);

  return (
    <SSRSafePortal>
      <Modal
        {...props}
        size="md"
        className={classes.modal}
        rootClassName={classes.root}
      >
        <ModalHeader />
        <ModalBody>
          <div
            className={clsx(classes.content, {
              [classes.isDeletePending]: isDeletePending,
            })}
          >
            <div className={classes.head}>
              <AssistantIcon assistant={assistant} size="lg" />
              <h2>{assistant.name}</h2>
              <p>{assistant.description}</p>
            </div>
            <dl className={classes.body}>
              {assistant.instructions && (
                <div>
                  <dd>Role</dd>
                  <dt>
                    <LineClampText numberOfLines={4}>
                      {assistant.instructions}
                    </LineClampText>
                  </dt>
                </div>
              )}

              <div>
                <dd>Tools</dd>
                <dt>
                  <ul className={classes.tools}>
                    {assistant.tools.map((item, index) => {
                      const tool = getAssistantToolReference(item);
                      return <ToolListItem key={tool.id} tool={tool} />;
                    })}
                  </ul>
                </dt>
              </div>

              {vectorStoreId && (
                <div>
                  <dd>Knowledge</dd>
                  <dt className={classes.vectorStore}>
                    {vectorStore ? (
                      <>
                        <strong>{vectorStore.name}</strong>
                        <span>
                          {pluralize(
                            'Document',
                            vectorStore.file_counts.total,
                            true,
                          )}
                        </span>
                      </>
                    ) : (
                      <SkeletonText lineCount={2} paragraph />
                    )}
                  </dt>
                </div>
              )}
            </dl>
          </div>
        </ModalBody>
        <ModalFooter className={classes.actionBar}>
          <div>
            {assistant && (
              <Button
                kind="danger--ghost"
                onClick={deleteAssistant}
                disabled={isProjectReadOnly}
              >
                Delete agent
              </Button>
            )}
          </div>
          <div>
            <Button
              kind="ghost"
              onClick={() => props.onRequestClose()}
              className={classes.hideOnMobile}
            >
              Cancel
            </Button>
            <Button
              kind="secondary"
              onClick={() => {
                router.push(`/${project.id}/builder/${assistant.id}`);
                props.onRequestClose();
              }}
              renderIcon={Edit}
              disabled={isProjectReadOnly}
            >
              Edit
            </Button>
          </div>
        </ModalFooter>
      </Modal>
    </SSRSafePortal>
  );
}

function ToolListItem({ tool }: { tool: ToolReference }) {
  const { toolName } = useToolInfo({
    toolReference: tool,
  });

  return (
    <li>
      <ToolIcon tool={tool} />
      {toolName}
    </li>
  );
}
