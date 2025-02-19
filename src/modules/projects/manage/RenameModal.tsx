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

import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { Modal } from '@/components/Modal/Modal';
import { ModalProps } from '@/layout/providers/ModalProvider';
import {
  Button,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@carbon/react';
import { useCallback, useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useUpdateProject } from '../api/mutations/useUpdateProject';
import { useListAllProjects } from '../api/queries/useListAllProjects';

interface Props extends ModalProps {
  project: Project;
  organization: Organization;
}

// TODO: refactor - a lot of the same code as in CreateProjectModal.tsx
export function RenameModal({ project, organization, ...props }: Props) {
  const htmlId = useId();
  const { name } = project;
  const { data: projects } = useListAllProjects();

  const { mutateAsync: updateProject } = useUpdateProject({
    onSuccess: () => {
      props.onRequestClose();
    },
  });

  const projectNames = useMemo(
    () =>
      projects?.projects
        .filter(({ id }) => id !== project.id)
        .map(({ name }) => name),
    [project.id, projects?.projects],
  );

  const isNameUnique = useCallback(
    (name: string) => {
      return !projectNames?.includes(name);
    },
    [projectNames],
  );

  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { name },
  });

  const onSubmit = async ({ name }: FormValues) => {
    await updateProject({ project, body: { name } });
  };

  return (
    <Modal {...props}>
      <ModalHeader>
        <h2>Rename workspace</h2>
      </ModalHeader>
      <ModalBody>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="name"
            rules={{ required: true, validate: isNameUnique }}
            render={({
              field: { onChange, value, ref },
              fieldState: { invalid },
            }) => (
              <TextInput
                id={`${htmlId}:name`}
                labelText="Name"
                value={value}
                onChange={onChange}
                ref={ref}
                data-modal-primary-focus
                disabled={isSubmitting}
                invalid={invalid}
                invalidText={
                  value ? 'Workspace name already exists' : 'Name is required'
                }
              />
            )}
          />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button
          kind="secondary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <InlineLoading description="Saving..." />
          ) : (
            'Rename workspace'
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

interface FormValues {
  name: string;
}
