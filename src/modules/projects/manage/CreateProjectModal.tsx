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
import { Modal } from '@/components/Modal/Modal';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { useRoutes } from '@/routes';
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
import { useCreateProject } from '../api/mutations/useCreateProject';
import { useListAllProjects } from '../api/queries/useListAllProjects';

interface CreateProjectValues {
  name: string;
}

interface Props {
  organization: Organization;
}

export function CreateProjectModal({
  organization,
  ...props
}: Props & ModalProps) {
  const htmlId = useId();
  const { routes, navigate } = useRoutes();

  const { data: projects } = useListAllProjects();

  const projectNames = useMemo(
    () => projects?.projects.map(({ name }) => name),
    [projects?.projects],
  );

  const { mutateAsync: createProject } = useCreateProject({
    onSuccess: (project) => {
      if (project) {
        navigate(routes.project({ projectId: project.id }));
      }
    },
  });

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
  } = useForm<CreateProjectValues>({
    mode: 'onChange',
  });

  const onSubmit = async ({ name }: CreateProjectValues) => {
    const project = await createProject({ name, visibility: 'private' });
    if (project) props.onRequestClose();
  };

  return (
    <Modal {...props} size="sm">
      <ModalHeader>
        <h2>Name your workspace</h2>
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
                labelText=""
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
          kind="ghost"
          onClick={() => props.onRequestClose()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          kind="secondary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? <InlineLoading description="Saving..." /> : 'Create'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
