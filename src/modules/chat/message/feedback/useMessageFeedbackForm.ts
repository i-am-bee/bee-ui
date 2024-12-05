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

import { MessageFeedback } from '@/app/api/threads-messages/types';
import { decodeEntityWithMetadata, encodeMetadata } from '@/app/api/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { readRunQuery } from '../../queries';
import { RunMetadata, ThreadRun } from '@/app/api/threads-runs/types';
import { updateRun } from '@/app/api/threads-runs';
import { useAppContext } from '@/layout/providers/AppProvider';

export const MESSAGE_FEEDBACK_FORM_DEFAULTS = {
  comment: '',
  categories: [],
};

interface Props {
  threadId: string | null;
  run?: ThreadRun;
  onSuccess?: (feedback?: MessageFeedback) => void;
}

export function useMessageFeedbackForm({ threadId, run, onSuccess }: Props) {
  const { project, organization } = useAppContext();

  const form = useForm<MessageFeedback>({
    defaultValues: MESSAGE_FEEDBACK_FORM_DEFAULTS,
    mode: 'onChange',
  });

  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async ({ ...body }: MessageFeedback) => {
      if (!threadId) {
        throw new Error('Missing required "threadId" parameter.');
      }

      if (!run) {
        throw new Error('Missing required "run" parameter.');
      }

      const response = await updateRun(
        organization.id,
        project.id,
        threadId,
        run.id,
        {
          metadata: encodeMetadata<RunMetadata>({
            ...run.uiMetadata,
            feedback: body,
          }),
        },
      );
      const thread = response
        ? decodeEntityWithMetadata<ThreadRun>(response)
        : undefined;

      return {
        response,
        feedback: thread?.uiMetadata.feedback,
      };
    },
    onSuccess: ({ response, feedback }) => {
      form.reset(
        {
          ...(feedback || MESSAGE_FEEDBACK_FORM_DEFAULTS),
          // keep current value to prevent flicker on double click
          vote: form.getValues('vote'),
        },
        {
          keepTouched: true,
        },
      );

      onSuccess?.(feedback);

      if (threadId && run) {
        queryClient.setQueryData(
          readRunQuery(organization.id, project.id, threadId, run.id).queryKey,
          (run) =>
            run
              ? {
                  ...run,
                  metadata: response?.metadata ?? {},
                }
              : undefined,
        );
      }
    },
  });

  useEffect(() => {
    if (run?.uiMetadata) {
      form.reset(run?.uiMetadata.feedback);
    }
  }, [form, run]);

  const onSubmit = useCallback(
    async (
      values: MessageFeedback,
      onSuccess?: (feedback?: MessageFeedback) => void,
    ) => {
      const { feedback } = await mutateAsync(values);
      onSuccess?.(feedback);

      return feedback;
    },
    [mutateAsync],
  );

  return { form, onSubmit };
}
