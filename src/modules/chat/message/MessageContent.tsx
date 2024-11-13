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

import { AssistantPlan } from '@/app/api/threads-runs/types';
import { Spinner } from '@/components/Spinner/Spinner';
import throttle from 'lodash/throttle';
import { useEffect, useMemo, useState } from 'react';
import { getLastCompletedStep } from '../assistant-plan/utils';
import { useRunContext } from '../providers/RunProvider';
import { ChatMessage } from '../types';
import { MarkdownContent } from './MarkdownContent';
import classes from './Message.module.scss';

export function MessageContent({ message }: { message: ChatMessage }) {
  const { run } = useRunContext();

  if (message.role === 'assistant') {
    const hasContent = Boolean(message.content);

    if (!hasContent) {
      if (message.error != null) {
        return null;
      }

      const requiredAction =
        run?.status === 'requires_action' ? run.required_action : undefined;

      const submitToolOutputsInProgress =
        requiredAction?.type === 'submit_tool_outputs' ||
        message.plan?.steps?.some(
          ({ status, toolCalls }) =>
            status === 'in_progress' &&
            toolCalls.some(({ type }) => type === 'function'),
        );
      const submitToolApprovalsInProgress =
        requiredAction?.type === 'submit_tool_approvals';

      if (submitToolOutputsInProgress) {
        return (
          <blockquote>
            <p>
              A function tool call is in progress. I am waiting for a response
              from the user.
            </p>
          </blockquote>
        );
      } else if (submitToolApprovalsInProgress) {
        return null;
      }

      if (message.pending) {
        return <PendingThought plan={message.plan} />;
      }

      if (!message.plan?.pending) {
        return (
          <blockquote>
            <p className={classes.noContent}>No message from assistant</p>
          </blockquote>
        );
      }

      return null;
    }
    return (
      <blockquote>
        <MarkdownContent content={message.content} />
      </blockquote>
    );
  }
  return (
    <blockquote>
      <p>{message.content}</p>
    </blockquote>
  );
}

function PendingThought({ plan }: { plan?: AssistantPlan }) {
  const THROTTLE_WAIT = 2000;
  const [thought, setThought] = useState(null);
  const pendingThought = getLastCompletedStep(plan)?.thought;

  const updateThought = useMemo(
    () =>
      throttle((thought) => {
        setThought(thought);
      }, THROTTLE_WAIT),
    [],
  );

  useEffect(() => {
    updateThought(pendingThought);
  }, [pendingThought, updateThought]);

  useEffect(() => {
    return () => updateThought.cancel();
  }, [updateThought]);

  return thought ? (
    <blockquote>
      <p className={classes.loading}>
        <span>{thought}</span>
      </p>
    </blockquote>
  ) : (
    <blockquote>
      <p className={classes.loading}>
        <span>Thinking</span>&nbsp;
        <Spinner />
      </p>
    </blockquote>
  );
}
