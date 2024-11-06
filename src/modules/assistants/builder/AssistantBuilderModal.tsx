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

import { AssistantResult } from '@/app/api/assistants/types';
import { Modal } from '@/components/Modal/Modal';
import { SSRSafePortal } from '@/components/SSRSafePortal/SSRSafePortal';
import { useAppContext } from '@/layout/providers/AppProvider';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { Button, InlineLoading, ModalBody, ModalHeader } from '@carbon/react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { assistantsQuery, lastAssistantsQuery } from '../library/queries';
import { Assistant } from '../types';
import { AssistantBaseInfo } from './AssistantBaseInfo';
import classes from './AssistantBuilderModal.module.scss';
import {
  AssistantBuilderProvider,
  useAssistantBuilder,
  useAssistantBuilderApi,
} from './AssistantBuilderProvider';
import { useDeleteAssistant } from './useDeleteAssistant';

export interface AssistantBuilderProps {
  onSaveSuccess?: (result: AssistantResult, isNew: boolean) => void;
  onDeleteSuccess?: () => void;
  assistant?: Assistant;
}

export default function AssistantBuilderModal({
  onSaveSuccess,
  onDeleteSuccess,
  assistant,
  ...props
}: AssistantBuilderProps & ModalProps) {
  const { isProjectReadOnly } = useAppContext();
  const handleSucces = (assistant: AssistantResult, isNew: boolean) => {
    onSaveSuccess?.(assistant, isNew);
    props.onRequestClose();
  };

  return (
    <SSRSafePortal>
      <Modal
        {...props}
        size="md"
        preventCloseOnClickOutside={!isProjectReadOnly}
        className={classes.modal}
      >
        <ModalHeader />
        <ModalBody>
          <AssistantBuilderProvider
            assistant={assistant}
            onSuccess={handleSucces}
          >
            <AssistantBuilderModalContent onDeleteSuccess={onDeleteSuccess} />
          </AssistantBuilderProvider>
        </ModalBody>
      </Modal>
    </SSRSafePortal>
  );
}

interface ContentProps {
  onDeleteSuccess?: () => void;
}

function AssistantBuilderModalContent({ onDeleteSuccess }: ContentProps) {
  const { project, isProjectReadOnly } = useAppContext();
  const { onSubmit } = useAssistantBuilderApi();
  const {
    assistant,
    formReturn: {
      formState: { isSubmitting, isDirty },
    },
  } = useAssistantBuilder();
  const queryClient = useQueryClient();
  const { deleteAssistant, isPending: isDeletePending } = useDeleteAssistant({
    assistant: assistant!,
    onSuccess: async () => {
      onDeleteSuccess?.();

      // invalidate all queries on GET:/assistants
      queryClient.invalidateQueries({
        queryKey: [assistantsQuery(project.id).queryKey.at(0)],
      });
      queryClient.invalidateQueries({
        queryKey: lastAssistantsQuery(project.id).queryKey,
      });
    },
  });

  const isSaved = Boolean(assistant && !isDirty);

  return (
    <>
      <div
        className={clsx(classes.content, {
          [classes.isDeletePending]: isDeletePending,
        })}
      >
        <div className={classes.main}>
          <div className={classes.form}>
            <AssistantBaseInfo />
          </div>
        </div>
        {!isProjectReadOnly && (
          <div className={classes.actionBar}>
            <div>
              {assistant && (
                <Button kind="danger--ghost" onClick={deleteAssistant}>
                  Delete bee
                </Button>
              )}
            </div>

            <div>
              {/* Copy feature is not available anymore */}
              {/* <Button
                kind="tertiary"
                className={classes.copyButton}
                renderIcon={Copy}
                onClick={onCopyToCustomize}
              >
                Copy to customize
              </Button> */}

              <Button
                kind="secondary"
                size="lg"
                onClick={() => onSubmit()}
                disabled={isSubmitting || isSaved}
                className={classes.saveButton}
              >
                {isSubmitting ? (
                  <InlineLoading description="Saving..." />
                ) : isSaved ? (
                  'Saved'
                ) : (
                  'Save bee'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* <ModalFooter>
        {assistant && !assistant.public && (
          <Button kind="danger--ghost" onClick={deleteAssistant}>
            Delete bee
          </Button>
        )}

        {assistant?.public ? (
          <Button
            kind="tertiary"
            className={classes.copyButton}
            renderIcon={Copy}
            onClick={onCopyToCustomize}
          >
            Copy to customize
          </Button>
        ) : (
          <Button
            kind="secondary"
            size="lg"
            onClick={() => onSubmit()}
            disabled={isSubmitting || isSaved}
            className={classes.saveButton}
          >
            {isSubmitting ? (
              <InlineLoading description="Saving..." />
            ) : isSaved ? (
              'Saved'
            ) : (
              'Save bee'
            )}
          </Button>
        )}
      </ModalFooter> */}
    </>
  );
}
