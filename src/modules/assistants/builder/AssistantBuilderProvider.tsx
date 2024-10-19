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
import { AssistantModel, AssistantResult } from '@/app/api/assistants/types';
import { SystemToolId, ToolType } from '@/app/api/threads-runs/types';
import { AssistantTools } from '@/app/api/types';
import { encodeMetadata } from '@/app/api/utils';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useNavigationControl } from '@/layout/providers/NavigationControlProvider';
import { useToast } from '@/layout/providers/ToastProvider';
import { isNotNull } from '@/utils/helpers';
import { useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  createContext,
  ReactElement,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import {
  AssistantIconColor,
  AssitantIconName,
} from '../icons/AssistantBaseIcon';
import { readAssistantQuery } from '../queries';
import { Assistant, AssistantMetadata } from '../types';
import {
  decodeStarterQuestionsMetadata,
  encodeStarterQuestionsMetadata,
  getAssistantFromAssistantResult,
} from '../utils';
import { useSaveAssistant } from './useSaveAssistant';

export type AssistantFormValues = {
  icon: {
    name?: AssitantIconName;
    color?: AssistantIconColor;
  };
  ownName: string;
  description?: string;
  instructions: string;
  tools: { type: ToolType; id: string }[];
  vectorStoreId?: string;
  model?: AssistantModel;
  starterQuestions?: StarterQuestion[];
};

export type StarterQuestion = { id: string; question: string };

export interface AssistantBuilderContextValue {
  assistant: Assistant | null;
  formReturn: UseFormReturn<AssistantFormValues>;
}

const AssistantBuilderContext = createContext<AssistantBuilderContextValue>(
  null as unknown as AssistantBuilderContextValue,
);

export interface AssistantBuilderApiContextValue {
  onSubmit: () => void;
  onCopyToCustomize: () => void;
}

const AssistantBuilderApiContext =
  createContext<AssistantBuilderApiContextValue>(
    null as unknown as AssistantBuilderApiContextValue,
  );

interface Props {
  assistant?: Assistant;
  onSuccess?: (result: AssistantResult, isNew: boolean) => void;
  children: ReactElement;
}

export function AssistantBuilderProvider({
  assistant: initialAssistant,
  onSuccess,
  children,
}: Props) {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { project } = useAppContext();
  const { setConfirmOnPageLeave, clearConfirmOnPageLeave } =
    useNavigationControl();

  const searchParams = useSearchParams();
  const isEditCurrent = searchParams?.has('current');
  // TODO: The duplication feature should be removed completely.
  const isDuplicate = searchParams?.has('duplicate');

  const [assistant, setAssistant] = useState<Assistant | null>(
    !isDuplicate ? (initialAssistant ?? null) : null,
  );

  const { saveAssistantAsync } = useSaveAssistant({
    onSuccess: (result: AssistantResult, isNew: boolean) => {
      if (!result) return;
      const assistant = getAssistantFromAssistantResult(result);
      if (isEditCurrent && assistant) {
        setAssistant(assistant);
      }
      onSuccess?.(result, isNew);
    },
  });

  const formReturn = useForm<AssistantFormValues>({
    mode: 'onChange',
    defaultValues: formValuesFromAssistant(
      initialAssistant ?? null,
      isDuplicate,
    ),
  });

  const { handleSubmit, reset, formState } = formReturn;

  useEffect(() => {
    if (isDuplicate) {
      return;
    }

    if (initialAssistant) {
      queryClient
        .fetchQuery(
          readAssistantQuery(
            project.id,
            initialAssistant?.id ?? '',
          ) as UseQueryOptions<AssistantResult>,
        )
        .then((data) => {
          const assistant = getAssistantFromAssistantResult(data);
          setAssistant(assistant);
          reset(formValuesFromAssistant(assistant), {
            keepValues: false,
          });
        });
    }
  }, [initialAssistant, queryClient, reset, isDuplicate, project.id]);

  useEffect(() => {
    if (formState.isDirty)
      setConfirmOnPageLeave(
        'Your bee has unsaved changes, do you really want to leave?',
      );
    else clearConfirmOnPageLeave();
    return () => clearConfirmOnPageLeave();
  }, [clearConfirmOnPageLeave, formState, setConfirmOnPageLeave]);

  const handleCopyToCustomize = useCallback(() => {
    if (!assistant) return;

    reset(formValuesFromAssistant(assistant, true), {
      keepValues: false,
    });
    setAssistant(null);
  }, [assistant, reset]);

  const onSubmit = useCallback(
    async ({
      ownName,
      instructions,
      description,
      tools: toolsValue,
      icon,
      vectorStoreId,
      model,
      starterQuestions,
    }: AssistantFormValues) => {
      const tools: AssistantTools = toolsValue
        .map(({ type, id }) => {
          if (type === 'user') return { type, user: { tool: { id } } };
          if (type === 'system')
            return { type, system: { id: id as SystemToolId } };
          if (type === 'code_interpreter') return { type };
          if (type === 'file_search') return FILE_SEARCH_TOOL_DEFINITION;
          return null;
        }, [])
        .filter(isNotNull);

      await saveAssistantAsync({
        id: assistant?.id,
        body: {
          name: ownName,
          instructions,
          description,
          tools,
          tool_resources: {
            ...assistant?.tool_resources,
            file_search: vectorStoreId
              ? { vector_store_ids: [vectorStoreId] }
              : undefined,
          },
          metadata: encodeMetadata<AssistantMetadata>({
            icon: icon.name,
            color: icon.color,
            ...(starterQuestions
              ? encodeStarterQuestionsMetadata(starterQuestions)
              : {}),
          }),
          model,
        },
      });
    },
    [assistant, saveAssistantAsync],
  );

  const handleError = useCallback(() => {
    addToast({
      title: 'Form contains errors, please check required fields.',
      timeout: 6000,
    });
  }, [addToast]);

  const apiValue = useMemo(
    () => ({
      onSubmit: handleSubmit(onSubmit, handleError),
      onCopyToCustomize: handleCopyToCustomize,
    }),
    [handleCopyToCustomize, handleError, handleSubmit, onSubmit],
  );

  return (
    <FormProvider {...formReturn}>
      <AssistantBuilderApiContext.Provider value={apiValue}>
        <AssistantBuilderContext.Provider value={{ assistant, formReturn }}>
          {children}
        </AssistantBuilderContext.Provider>
      </AssistantBuilderApiContext.Provider>
    </FormProvider>
  );
}

export function useAssistantBuilderApi() {
  const context = use(AssistantBuilderApiContext);

  if (!context) {
    throw new Error(
      'useAssistantBuilderApi must be used within a AssistantBuilderProvider',
    );
  }

  return context;
}

export function useAssistantBuilder() {
  const context = use(AssistantBuilderContext);

  if (!context) {
    throw new Error(
      'useAssistantBuilder must be used within a AssistantBuilderProvider',
    );
  }

  return context;
}

function formValuesFromAssistant(
  assistant: Assistant | null,
  isCopy?: boolean,
): AssistantFormValues {
  return {
    icon: {
      name: assistant?.metadata.icon,
      color: assistant?.metadata.color ?? 'white',
    },
    ownName: assistant?.name
      ? `${assistant.name}${isCopy ? ' ( Copy )' : ''}`
      : 'New Bee',
    description: assistant?.description ?? '',
    instructions: assistant?.instructions || '',
    tools: assistant?.tools.reduce(
      (result: AssistantFormValues['tools'], tool) => {
        if (tool?.type === 'user')
          result.push({ id: tool.user.tool.id, type: tool.type });
        if (tool?.type === 'system')
          result.push({ id: tool.system.id, type: tool.type });
        if (tool?.type === 'code_interpreter' || tool?.type === 'file_search')
          result.push({ id: tool.type, type: tool.type });

        return result;
      },
      [],
    ) ?? [
      { id: 'code_interpreter', type: 'code_interpreter' },
      { id: 'read_file', type: 'system' },
      { id: 'file_search', type: 'file_search' },
    ],
    vectorStoreId:
      assistant?.tool_resources?.file_search?.vector_store_ids?.at(0),
    model: assistant?.model as AssistantModel,
    starterQuestions: decodeStarterQuestionsMetadata(assistant?.metadata),
  };
}

export const FILE_SEARCH_TOOL_DEFINITION = {
  type: 'file_search',
  file_search: { max_num_results: 10 },
} as const;
