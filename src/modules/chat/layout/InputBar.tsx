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

import { Spinner } from '@/components/Spinner/Spinner';
import { TextAreaAutoHeight } from '@/components/TextAreaAutoHeight/TextAreaAutoHeight';
import { useAppContext } from '@/layout/providers/AppProvider';
import { AssistantBaseIcon } from '@/modules/assistants/icons/AssistantBaseIcon';
import { lastAssistantsQuery } from '@/modules/assistants/library/queries';
import {
  dispatchChangeEventOnFormInputs,
  submitFormOnEnter,
} from '@/utils/formUtils';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import { Button } from '@carbon/react';
import { Send, StopOutlineFilled, WarningFilled } from '@carbon/react/icons';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { memo, useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { mergeRefs } from 'react-merge-refs';
import { Attachment } from '../attachments/Attachment';
import { AttachmentsList } from '../attachments/AttachmentsList';
import { SendMessageResult, useChat } from '../providers/ChatProvider';
import { useFilesUpload } from '../providers/FilesUploadProvider';
import { FilesMenu } from './FilesMenu';
import classes from './InputBar.module.scss';
import { PromptSuggestions } from './PromptSuggestions';
import { ThreadSettings } from './ThreadSettings';

interface Props {
  showSuggestions?: boolean;
  onMessageSubmit?: () => void;
  onMessageSent?: (result: SendMessageResult) => void;
}

export const InputBar = memo(function InputBar({
  showSuggestions,
  onMessageSubmit,
  onMessageSent,
}: Props) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const threadSettingsButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [promptSuggestionsOpen, setPromptSuggestionsOpen] = useState(false);
  const {
    files,
    isPending: isFilesPending,
    dropzone: { getInputProps, open: openUpload },
    removeFile,
  } = useFilesUpload();
  const { sendMessage, status, cancel, assistant, disabledTools } = useChat();
  const { project } = useAppContext();

  const { register, watch, handleSubmit, setValue } = useForm<FormValues>({
    mode: 'onChange',
  });

  const resetForm = useCallback(() => {
    {
      const formElem = formRef.current;
      if (!formElem) return;

      formElem.reset();

      dispatchChangeEventOnFormInputs(formElem);
    }
  }, []);

  const submitFormWithInput = (value: string) => {
    const formElem = formRef.current;

    if (!formElem) return;

    setValue('input', value);

    formElem.requestSubmit();
  };

  const isPending = status !== 'ready';

  const toolsInUse = assistant.data?.tools?.length !== disabledTools.length;

  const inputValue = watch('input');

  const isFileUploadEnabled = isFeatureEnabled(FeatureName.Files);

  const { ref: inputFormRef, ...inputFormProps } = register('input', {
    required: true,
  });

  return (
    <form
      className={clsx(classes.root, {
        [classes.fileUploadEnabled]: isFileUploadEnabled,
      })}
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        if (isPending || isFilesPending) return;

        handleSubmit(({ input }) => {
          onMessageSubmit?.();
          resetForm();
          sendMessage(input).then((result) => {
            queryClient.invalidateQueries({
              queryKey: lastAssistantsQuery(project.id).queryKey,
            });

            onMessageSent?.(result);
          });
        })();
      }}
    >
      <div className={classes.container}>
        {files.length > 0 && (
          <AttachmentsList className={classes.files}>
            {files.map(({ id, originalFile, status, vectorStoreFile }) => (
              <li key={id}>
                <Attachment
                  size="md"
                  startIcon={
                    status === 'uploading' || status === 'embedding'
                      ? Spinner
                      : vectorStoreFile?.last_error
                        ? WarningFilled
                        : undefined
                  }
                  className={clsx({
                    [classes.fileFailed]: vectorStoreFile?.last_error,
                  })}
                  onRemoveClick={() => removeFile(id)}
                  description={
                    vectorStoreFile?.last_error
                      ? 'Processing of this file for file search tool was not successful.'
                      : undefined
                  }
                >
                  {originalFile.name}
                </Attachment>
              </li>
            ))}
          </AttachmentsList>
        )}

        <div className={classes.inputContainer}>
          <div className={classes.actions}>
            <ThreadSettings buttonRef={threadSettingsButtonRef} />

            {isFileUploadEnabled && (
              <>
                <input type="file" {...getInputProps()} />
                <FilesMenu onUploadClick={openUpload} />
              </>
            )}
          </div>

          <TextAreaAutoHeight
            className={classes.textarea}
            rows={1}
            placeholder="Type your question or drag a document…"
            autoFocus
            ref={mergeRefs([inputFormRef, inputRef])}
            {...inputFormProps}
            onKeyDown={submitFormOnEnter}
          />
          <div className={classes.submitBtnContainer}>
            {!isPending ? (
              <Button
                type="submit"
                renderIcon={Send}
                kind="ghost"
                size="sm"
                hasIconOnly
                iconDescription="Send"
                disabled={isFilesPending || !inputValue}
              />
            ) : (
              <Button
                renderIcon={StopOutlineFilled}
                kind="ghost"
                size="sm"
                hasIconOnly
                iconDescription="Cancel"
                disabled={status === 'waiting'}
                onClick={() => {
                  cancel();
                }}
              />
            )}
          </div>

          {showSuggestions && (
            <PromptSuggestions
              inputRef={inputRef}
              isOpen={promptSuggestionsOpen}
              setIsOpen={setPromptSuggestionsOpen}
              onSubmit={submitFormWithInput}
            />
          )}
        </div>
      </div>

      <p className={classes.disclaimer}>
        <AssistantBaseIcon name="Bee" size="sm" />
        <span>
          Bee is an experimental AI that can fly off course. Double check all
          important information.
          {toolsInUse && (
            <>
              {' '}
              <button
                className={classes.toolsButton}
                type="button"
                onClick={() => threadSettingsButtonRef.current?.click()}
              >
                External tools in use
              </button>
              .
            </>
          )}
        </span>
      </p>
    </form>
  );
});

interface FormValues {
  input: string;
}
