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
import {
  dispatchInputEventOnFormTextarea,
  submitFormOnEnter,
} from '@/utils/formUtils';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import { Button } from '@carbon/react';
import { Send, StopOutlineFilled, WarningFilled } from '@carbon/react/icons';
import clsx from 'clsx';
import { memo, useCallback, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { mergeRefs } from 'react-merge-refs';
import { Attachment } from '../attachments/Attachment';
import { AttachmentsList } from '../attachments/AttachmentsList';
import {
  SendMessageResult,
  useChat,
  useChatMessages,
} from '../providers/ChatProvider';
import { useFilesUpload } from '../providers/FilesUploadProvider';
import { FilesMenu } from './FilesMenu';
import classes from './InputBar.module.scss';
import { PromptSuggestions } from './PromptSuggestions';
import { ThreadSettings } from './ThreadSettings';
import { useMessages } from '../providers/useMessages';

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [promptSuggestionsOpen, setPromptSuggestionsOpen] = useState(false);
  const {
    files,
    isPending: isFilesPending,
    dropzone,
    removeFile,
  } = useFilesUpload();
  const {
    sendMessage,
    status,
    cancel,
    assistant,
    builderState,
    threadSettingsEnabled,
    inputPlaceholder,
  } = useChat();
  const messages = useChatMessages();

  const { register, watch, handleSubmit, setValue } = useForm<FormValues>({
    mode: 'onChange',
  });

  const resetForm = useCallback(() => {
    {
      const formElem = formRef.current;
      if (!formElem) return;

      formElem.reset();

      dispatchInputEventOnFormTextarea(formElem);
    }
  }, []);

  const fillWithInput = (value: string) => {
    const formElem = formRef.current;

    if (!formElem) return;

    setValue('input', value);
    setPromptSuggestionsOpen(false);
    dispatchInputEventOnFormTextarea(formElem);

    inputRef.current?.focus();
  };

  const isPending = status !== 'ready';
  const inputValue = watch('input');
  const isFileUploadEnabled = isFeatureEnabled(FeatureName.Files);

  const { ref: inputFormRef, ...inputFormProps } = register('input', {
    required: true,
  });

  const isSubmitDisabled =
    isFilesPending || !inputValue || (builderState && !builderState.isSaved);

  const placeholder = inputPlaceholder
    ? messages.length
      ? inputPlaceholder.ongoing
      : inputPlaceholder.initial
    : 'Ask a question…';

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
          <TextAreaAutoHeight
            className={classes.textarea}
            rows={1}
            placeholder={placeholder}
            autoFocus={!builderState}
            ref={mergeRefs([inputFormRef, inputRef])}
            {...inputFormProps}
            onKeyDown={(e) => !isSubmitDisabled && submitFormOnEnter(e)}
            onFocus={() => builderState?.onAutoSaveAssistant()}
          />
          <div className={classes.actionBar}>
            <div className={classes.actions}>
              {threadSettingsEnabled && <ThreadSettings />}

              {isFileUploadEnabled && dropzone && (
                <>
                  <input
                    type="file"
                    {...dropzone.getInputProps()}
                    disabled={!assistant}
                  />
                  <FilesMenu onUploadClick={dropzone.open} />
                </>
              )}
            </div>

            <div className={classes.submitBtnContainer}>
              {!isPending ? (
                <Button
                  type="submit"
                  renderIcon={Send}
                  kind="ghost"
                  size="sm"
                  hasIconOnly
                  iconDescription="Send"
                  disabled={isSubmitDisabled}
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
          </div>

          {showSuggestions && (
            <PromptSuggestions
              inputRef={inputRef}
              isOpen={promptSuggestionsOpen}
              setIsOpen={setPromptSuggestionsOpen}
              onSubmit={fillWithInput}
            />
          )}
        </div>
      </div>
    </form>
  );
});

interface FormValues {
  input: string;
}
