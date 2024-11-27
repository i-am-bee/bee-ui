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

import { Project } from '@/app/api/projects/types';
import { ToolsCreateBody } from '@/app/api/tools/types';
import { EditableSyntaxHighlighter } from '@/components/EditableSyntaxHighlighter/EditableSyntaxHighlighter';
import { Modal } from '@/components/Modal/Modal';
import { SettingsFormGroup } from '@/components/SettingsFormGroup/SettingsFormGroup';
import { ModalProps, useModal } from '@/layout/providers/ModalProvider';
import {
  Button,
  FormLabel,
  InlineLoading,
  InlineNotification,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@carbon/react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useId } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import classes from './UserToolModal.module.scss';
import { useModalControl } from '@/layout/providers/ModalControlProvider';
import { Artifact } from '../types';
import { useSaveApp } from '../hooks/useSaveApp';

interface FormValues {
  icon: string;
  name: string;
  description?: string;
}

interface Props extends ModalProps {
  artifact?: Artifact;
  project: Project;
  onSaveSuccess?: (artifact: Artifact) => void;
}

export function EditAppModal({
  artifact,
  project,
  onSaveSuccess,
  ...props
}: Props) {
  const { onRequestClose } = props;
  const { openConfirmation } = useModal();
  const id = useId();
  const {
    setConfirmOnRequestClose,
    clearConfirmOnRequestClose,
    onRequestCloseSafe,
  } = useModalControl();

  const { mutate: mutateSave } = useSaveApp({ project });

  const editMode = artifact != undefined;

  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<FormValues>({
    defaultValues: {
      name: artifact?.name || '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (isDirty)
      setConfirmOnRequestClose(
        'Your app has unsaved changes, do you really want to leave?',
      );
    else clearConfirmOnRequestClose();
    return () => clearConfirmOnRequestClose();
  }, [clearConfirmOnRequestClose, isDirty, setConfirmOnRequestClose]);

  const onSubmit: SubmitHandler<FormValues> = useCallback(
    async (data) => {
      await mutateSave({
        id: artifact?.id,
        body: createSaveArtifactBody(data),
      });
    },
    [artifact?.id, mutateSave],
  );

  return (
    <Modal {...props} preventCloseOnClickOutside className={classes.modal}>
      <ModalHeader>
        <h2>{editMode ? 'Edit custom tool' : 'Create a custom tool'}</h2>
      </ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <SettingsFormGroup>
            <div className={classes.group}>
              <TextInput
                size="lg"
                id={`${id}:name`}
                labelText="Name of tool"
                placeholder="Type tool name"
                invalid={errors.name != null}
                {...register('name', {
                  required: true,
                })}
              />

              <p className={classes.helperText}>
                This is your tool’s display name, it can be a real name or
                pseudonym.
              </p>
            </div>

            <div className={classes.group}>
              <div className={classes.groupHeader}>
                <FormLabel id={`${id}:code`}>Python code</FormLabel>

                {/* <Link href="/" className={classes.link}>
                  <span>View documentation</span>
                  <ArrowUpRight />
                </Link> */}
              </div>

              <Controller
                name="sourceCode"
                control={control}
                rules={{
                  required: true,
                }}
                render={({ field }) => (
                  <EditableSyntaxHighlighter
                    id={`${id}:code`}
                    value={field.value}
                    onChange={field.onChange}
                    required
                    invalid={errors.sourceCode != null}
                    rows={16}
                  />
                )}
              />

              <p className={classes.helperText}>
                Do not share any authentication token in your Python function.
                Exposing it can compromise any account.
              </p>
            </div>

            {isSaveError && (
              <InlineNotification
                className={classes.error}
                kind="error"
                title={saveError.message}
                lowContrast
                hideCloseButton
              />
            )}
          </SettingsFormGroup>
        </form>
      </ModalBody>

      <ModalFooter>
        <div className={classes.actions}>
          <Button kind="ghost" onClick={() => onRequestCloseSafe()}>
            Cancel
          </Button>

          <Button
            kind="secondary"
            type="submit"
            disabled={!isValid || isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            {isSubmitting ? (
              <InlineLoading
                description={editMode ? 'Saving...' : 'Creating...'}
              />
            ) : editMode ? (
              'Save edit'
            ) : (
              'Create tool'
            )}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

function createSaveArtifactBody({
  name,
  description,
}: FormValues): ToolsCreateBody {
  return {
    name,
    description,
  };
}
