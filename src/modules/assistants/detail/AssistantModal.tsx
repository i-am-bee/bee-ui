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
import { ModalProps, useModal } from '@/layout/providers/ModalProvider';
import { useVectorStore } from '@/modules/knowledge/api/queries/useVectorStore';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';
import { PublicToolModal } from '@/modules/tools/manage/PublicToolModal';
import { UserToolModal } from '@/modules/tools/manage/UserToolModal';
import { ToolDescription, ToolIcon } from '@/modules/tools/ToolCard';
import { getAssistantToolReference } from '@/modules/tools/utils';
import { useRoutes } from '@/routes';
import { noop } from '@/utils/helpers';
import {
  Button,
  FormLabel,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SkeletonText,
} from '@carbon/react';
import { Edit, Folder, Launch, TrashCan } from '@carbon/react/icons';
import { useDeleteAssistant } from '../api/mutations/useDeleteAssistant';
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
  const { isProjectReadOnly } = useAppContext();
  const { routes, navigate } = useRoutes();

  const { mutateAsyncWithConfirmation: deleteAssistant } = useDeleteAssistant({
    onSuccess: onDeleteSuccess,
  });

  const vectorStoreId =
    assistant.tool_resources?.file_search?.vector_store_ids?.at(0);
  const { data: vectorStore } = useVectorStore({ id: vectorStoreId });

  const { name, description, instructions, tools } = assistant;

  return (
    <SSRSafePortal>
      <Modal {...props} className={classes.modal}>
        <ModalHeader />

        <ModalBody>
          <div className={classes.content}>
            <AssistantIcon assistant={assistant} size="lg" />

            <h2 className={classes.heading}>{name}</h2>

            {description && (
              <p className={classes.description}>{description}</p>
            )}

            {instructions && (
              <>
                <hr />

                <div className={classes.group}>
                  <FormLabel>Role</FormLabel>

                  <LineClampText
                    numberOfLines={4}
                    className={classes.instructions}
                  >
                    {instructions}
                  </LineClampText>
                </div>
              </>
            )}

            {tools.length > 0 && (
              <>
                <hr />

                <div className={classes.group}>
                  <FormLabel>Tools</FormLabel>
                  <ul className={classes.tools}>
                    {tools.map((item) => {
                      const tool = getAssistantToolReference(item);
                      return <ToolListItem key={tool.id} tool={tool} />;
                    })}
                  </ul>
                </div>
              </>
            )}

            {vectorStoreId && (
              <>
                <hr />

                <div className={classes.group}>
                  <FormLabel>Knowledge base</FormLabel>
                  <div className={classes.vectorStore}>
                    {vectorStore ? (
                      <p>
                        <Folder />
                        <span>{vectorStore.name}</span>
                      </p>
                    ) : (
                      <SkeletonText />
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            kind="danger--tertiary"
            onClick={() => deleteAssistant(assistant)}
            disabled={isProjectReadOnly}
            renderIcon={TrashCan}
          >
            Delete
          </Button>

          <Button
            kind="secondary"
            onClick={() => {
              navigate(routes.assistantBuilder({ assistantId: assistant.id }));
              props.onRequestClose();
            }}
            renderIcon={Edit}
            disabled={isProjectReadOnly}
          >
            Edit
          </Button>
        </ModalFooter>
      </Modal>
    </SSRSafePortal>
  );
}

function ToolListItem({ tool }: { tool: ToolReference }) {
  const { openModal } = useModal();

  const {
    toolName,
    tool: toolData,
    isLoading,
  } = useToolInfo({
    toolReference: tool,
  });

  const description =
    toolData?.uiMetadata.description_short ??
    toolData?.user_description ??
    toolData?.description;

  return (
    <li className={classes.tool}>
      <ToolIcon tool={tool} size="sm" className={classes.toolIcon} />

      <div className={classes.toolBody}>
        <button
          className={classes.toolButton}
          type="button"
          onClick={
            toolData
              ? () =>
                  openModal((props) =>
                    tool.type === 'user' ? (
                      <UserToolModal.View tool={toolData} {...props} />
                    ) : (
                      <PublicToolModal {...props} tool={toolData} />
                    ),
                  )
              : noop
          }
        >
          {toolName}
        </button>

        {(!toolData && !isLoading) || isLoading ? (
          <SkeletonText />
        ) : (
          description && <ToolDescription description={description} />
        )}
      </div>

      <span className={classes.toolButtonIcon}>
        <Launch />
      </span>
    </li>
  );
}
