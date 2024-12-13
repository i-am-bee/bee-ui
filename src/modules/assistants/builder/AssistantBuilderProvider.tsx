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
import { SystemToolId } from '@/app/api/threads-runs/types';
import { ToolReference } from '@/app/api/tools/types';
import { AssistantTools } from '@/app/api/types';
import { decodeEntityWithMetadata, encodeMetadata } from '@/app/api/utils';
import {
  useAppApiContext,
  useAppContext,
} from '@/layout/providers/AppProvider';
import { useNavigationControl } from '@/layout/providers/NavigationControlProvider';
import { useToast } from '@/layout/providers/ToastProvider';
import { ONBOARDING_PARAM } from '@/utils/constants';
import { isNotNull } from '@/utils/helpers';
import isEmpty from 'lodash/isEmpty';
import pick from 'lodash/pick';
import { useSearchParams } from 'next/navigation';
import {
  createContext,
  ReactElement,
  use,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import {
  AssistantIconColor,
  AssitantIconName,
} from '../icons/AssistantBaseIcon';
import { ASSISTANT_TEMPLATES } from '../templates';
import { Assistant, AssistantMetadata, AssistantTemplate } from '../types';
import {
  decodeStarterQuestionsMetadata,
  encodeStarterQuestionsMetadata,
} from '../utils';
import { useSaveAssistant } from './useSaveAssistant';
import { useOnboardingCompleted } from '@/modules/users/useOnboardingCompleted';

export type AssistantFormValues = {
  icon: {
    name?: AssitantIconName;
    color?: AssistantIconColor;
  };
  ownName: string;
  description?: string;
  instructions: string;
  tools: ToolReference[];
  vectorStoreId?: string;
  model?: AssistantModel;
  starterQuestions?: StarterQuestion[];
};

export type StarterQuestion = { id: string; question: string };

export interface AssistantBuilderContextValue {
  assistant: Assistant | null;
  formReturn: UseFormReturn<AssistantFormValues>;
  isOnboarding?: boolean;
}

const AssistantBuilderContext = createContext<AssistantBuilderContextValue>(
  null as unknown as AssistantBuilderContextValue,
);

export interface AssistantBuilderApiContextValue {
  onSubmit: () => void;
}

const AssistantBuilderApiContext =
  createContext<AssistantBuilderApiContextValue>(
    null as unknown as AssistantBuilderApiContextValue,
  );

interface Props {
  assistant?: Assistant;
  children: ReactElement;
}

export function AssistantBuilderProvider({
  assistant: initialAssistant,
  children,
}: Props) {
  const { addToast } = useToast();
  const { project, assistant } = useAppContext();
  const { selectAssistant } = useAppApiContext();
  const { setConfirmOnPageLeave, clearConfirmOnPageLeave } =
    useNavigationControl();

  const searchParams = useSearchParams();
  const isDuplicate = searchParams?.has('duplicate');
  const isOnboarding = searchParams?.has(ONBOARDING_PARAM);
  const templateKey = searchParams?.get('template');
  const assistantTemplate = templateKey
    ? ASSISTANT_TEMPLATES.find((template) => template.key === templateKey)
    : undefined;

  useOnboardingCompleted(isOnboarding ? 'assistants' : null);

  const { saveAssistantAsync } = useSaveAssistant({
    onSuccess: (result: AssistantResult, isNew: boolean) => {
      if (!result) return;
      const assistantFromResult = decodeEntityWithMetadata<Assistant>(result);
      selectAssistant(assistantFromResult);

      if (isNew)
        window.history.pushState(
          {},
          '',
          `/${project.id}/builder/${assistantFromResult.id}`,
        );
    },
  });

  const formReturn = useForm<AssistantFormValues>({
    mode: 'onChange',
    defaultValues: formValuesFromAssistant(
      assistantTemplate ? assistantTemplate : (initialAssistant ?? null),
      isDuplicate,
    ),
  });

  const { handleSubmit, reset, formState } = formReturn;

  useEffect(() => {
    if (isDuplicate || !initialAssistant) {
      selectAssistant(null);
    } else {
      selectAssistant(initialAssistant);
    }

    reset(
      formValuesFromAssistant(
        assistantTemplate ? assistantTemplate : (initialAssistant ?? null),
        isDuplicate,
      ),
      {
        keepValues: false,
      },
    );
  }, [
    isDuplicate,
    initialAssistant,
    selectAssistant,
    reset,
    assistantTemplate,
  ]);

  useEffect(() => {
    if (!isEmpty(formState.dirtyFields))
      setConfirmOnPageLeave(
        'Your agent has unsaved changes, do you really want to leave?',
      );
    else clearConfirmOnPageLeave();
    return () => clearConfirmOnPageLeave();
  }, [clearConfirmOnPageLeave, formState, setConfirmOnPageLeave]);

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

      const metadata: AssistantMetadata = {
        icon: icon.name,
        color: icon.color,
      };
      if (starterQuestions) {
        Object.assign(
          metadata,
          encodeStarterQuestionsMetadata(starterQuestions),
        );
      }
      // When creating assistant set origin fields, when updating just copy them
      if (assistant?.id == null) {
        Object.assign(
          metadata,
          assistantTemplate
            ? { origin: 'template', originTemplate: assistantTemplate.key }
            : { origin: 'new' },
        );
      } else {
        Object.assign(
          metadata,
          pick(assistant.uiMetadata, ['origin', 'originTemplate']),
        );
      }

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
          metadata: encodeMetadata(metadata),
          model,
        },
      });

      formReturn.reset({}, { keepValues: true });
    },
    [assistant, assistantTemplate, formReturn, saveAssistantAsync],
  );

  const handleError = useCallback(() => {
    addToast({
      title: 'Form contains errors, please check required fields.',
      kind: 'warning',
      timeout: 6000,
    });
  }, [addToast]);

  const apiValue = useMemo(
    () => ({
      onSubmit: handleSubmit(onSubmit, handleError),
    }),
    [handleError, handleSubmit, onSubmit],
  );

  return (
    <FormProvider {...formReturn}>
      <AssistantBuilderApiContext.Provider value={apiValue}>
        <AssistantBuilderContext.Provider
          value={{ assistant, formReturn, isOnboarding }}
        >
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
  assistant: Assistant | AssistantTemplate | null,
  isDuplicate?: boolean,
): AssistantFormValues {
  return {
    icon: {
      name: assistant?.uiMetadata.icon,
      color: assistant?.uiMetadata.color ?? 'white',
    },
    ownName: assistant?.name
      ? `${assistant.name}${isDuplicate ? ' ( Copy )' : ''}`
      : 'New agent',
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
    starterQuestions: decodeStarterQuestionsMetadata(assistant?.uiMetadata),
  };
}

export const FILE_SEARCH_TOOL_DEFINITION = {
  type: 'file_search',
  file_search: { max_num_results: 10 },
} as const;
