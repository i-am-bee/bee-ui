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
import { updateProject } from '@/app/api/projects';
import { Project, ProjectsListResponse } from '@/app/api/projects/types';
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
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { produce } from 'immer';
import { useCallback, useId, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { PROJECTS_QUERY_PARAMS } from '../ProjectSelector';
import { useProjects } from '../hooks/useProjects';
import { useProjectsQueries } from '../queries';

interface Props extends ModalProps {
  project: Project;
  organization: Organization;
}

// TODO: refactor - a lot of the same code as in CreateProjectModal.tsx
export function RenameModal({ project, organization, ...props }: Props) {
  const htmlId = useId();
  const { id, name } = project;
  const queryClient = useQueryClient();

  const projectsQueries = useProjectsQueries();
  const { data: projects } = useProjects();

  const { mutateAsync } = useMutation({
    mutationFn: (newName: string) =>
      updateProject(organization.id, id, { name: newName }),
    onSuccess: (result, newName) => {
      if (result) {
        queryClient.setQueryData<InfiniteData<ProjectsListResponse>>(
          projectsQueries.list(PROJECTS_QUERY_PARAMS).queryKey,
          produce((draft) => {
            if (!draft?.pages) return null;
            for (const page of draft.pages) {
              page.data = page.data.map((item) =>
                item.id === id ? { ...item, name: newName } : item,
              );
            }
          }),
        );
      }
      queryClient.invalidateQueries(projectsQueries.detail(id));
      props.onRequestClose();
    },
    meta: {
      invalidates: [projectsQueries.lists()],
      errorToast: {
        title: 'Failed to rename the workspace',
        includeErrorMessage: true,
      },
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
    register,
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: { name },
  });

  const onSubmit = async ({ name }: FormValues) => {
    await mutateAsync(name);
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
