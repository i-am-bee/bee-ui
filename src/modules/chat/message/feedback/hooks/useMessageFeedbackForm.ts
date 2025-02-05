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
import { Run, RunMetadata } from '@/app/api/threads-runs/types';
import { encodeMetadata } from '@/app/api/utils';
import { useUpdateRun } from '@/modules/chat/api/mutations/useUpdateRun';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';

export const MESSAGE_FEEDBACK_FORM_DEFAULTS = {
  comment: '',
  categories: [],
};

interface Props {
  threadId: string | null;
  run?: Run;
  onSuccess?: (feedback?: MessageFeedback) => void;
}

export function useMessageFeedbackForm({ threadId, run, onSuccess }: Props) {
  const form = useForm<MessageFeedback>({
    defaultValues: MESSAGE_FEEDBACK_FORM_DEFAULTS,
    mode: 'onChange',
  });

  const { mutateAsync } = useUpdateRun({
    onSuccess: (run) => {
      const feedback = run?.uiMetadata.feedback;

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
      if (!threadId || !run) {
        throw new Error('Missing required "threadId" or "run" parameter.');
      }

      const updatedRun = await mutateAsync({
        threadId,
        runId: run.id,
        body: {
          metadata: encodeMetadata<RunMetadata>({
            ...run.uiMetadata,
            feedback: values,
          }),
        },
      });

      const feedback = updatedRun?.uiMetadata.feedback;

      onSuccess?.(feedback);

      return feedback;
    },
    [mutateAsync, threadId, run],
  );

  return { form, onSubmit };
}
