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

import { Modal } from '@/components/Modal/Modal';
import {
  Button,
  InlineLoading,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from '@carbon/react';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Project, ProjectCreateBody } from '@/app/api/projects/types';
import { createProject } from '@/app/api/projects';
import { useRouter } from 'next-nprogress-bar';
import { PROJECTS_QUERY_PARAMS } from '../ProjectSelector';
import { projectsQuery } from '../queries';
import { useProjects } from '../hooks/useProjects';
import { useAppContext } from '@/layout/providers/AppProvider';

interface CreateProjectValues {
  name: string;
}

interface Props {
  onSuccess?: (project: Project) => void;
}

export function CreateProjectModal({
  onSuccess,
  ...props
}: Props & ModalProps) {
  const htmlId = useId();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { organization } = useAppContext();

  const { data: projects } = useProjects({ organization });

  const projectNames = useMemo(
    () => projects?.projects.map(({ name }) => name),
    [projects?.projects],
  );

  const { mutateAsync } = useMutation({
    mutationFn: (body: ProjectCreateBody) =>
      createProject(organization.id, body),
    onSuccess: (response) => {
      if (response) {
        queryClient.invalidateQueries({
          queryKey: [
            projectsQuery(organization.id, PROJECTS_QUERY_PARAMS).queryKey.at(
              0,
            ),
          ],
        });
        router.push(`/${response.id}`);

        onSuccess?.(response);
      }
    },
    meta: {
      errorToast: {
        title: 'Failed to create the project',
        includeErrorMessage: true,
      },
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
    formState: { isSubmitting, isValid },
  } = useForm<CreateProjectValues>({
    mode: 'onChange',
  });

  const onSubmit = async ({ name }: CreateProjectValues) => {
    const project = await mutateAsync({ name, visibility: 'private' });
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
