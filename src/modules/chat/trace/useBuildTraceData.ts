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

import { useQuery } from '@tanstack/react-query';
import { listSpansQuery } from './queries';
import { readRunTraceQuery } from '../queries';
import { InterationType, TraceSpan } from '@/app/observe/api/types';
import {
  getLastNewTokenSpan,
  getGeneratedTokenCountSafe,
  getExecutionTime,
} from './utils';
import { useMemo } from 'react';
import { GENERATE_EVENT_TOOL_START, TraceData } from './types';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props {
  enabled: boolean;
  threadId?: string;
  runId?: string;
}

export function useBuildTraceData({
  enabled,
  threadId,
  runId,
}: Props): TraceData | null {
  const { project, organization } = useAppContext();

  const { data: runTraceData } = useQuery({
    ...readRunTraceQuery(
      organization.id,
      project.id,
      threadId ?? '',
      runId ?? '',
    ),
    enabled: Boolean(enabled && threadId && runId),
  });

  const { data: traceSpans } = useQuery({
    ...listSpansQuery(organization.id, project.id, runTraceData?.id ?? ''),
    enabled: Boolean(runTraceData),
  });

  const spans = traceSpans?.results;

  const data = useMemo(() => {
    if (!spans) return null;

    const iterations = spans
      .filter(
        (span) => !span.parent_id && !['success', 'error'].includes(span.name),
      )
      .map((span) => {
        return {
          span,
          children: loadNestedSpans(span, spans).flat(),
        };
      })
      .filter((span) => span.children.length > 1)
      .map((iteration) => {
        const customEventData = iteration.children.find(
          (span) => span.name === 'startCustom',
        )?.attributes.data;
        const rawPrompt = customEventData?.rawPrompt
          ? String(customEventData.rawPrompt)
          : undefined;

        return {
          groupId: iteration.span.context.span_id,
          executionTime: getExecutionTime(iteration.children),
          tokenCount: getGeneratedTokenCountSafe(
            getLastNewTokenSpan(iteration.children),
          ),
          rawPrompt,
          type: iteration.children.find(
            (span) => span.name === GENERATE_EVENT_TOOL_START,
          )
            ? InterationType.TOOL
            : InterationType.FINAL_ANSWER,
        };
      });

    const executionTime = getExecutionTime(spans);

    const tokenCount = iterations.reduce(
      (tokenCount, iteration) => tokenCount + (iteration?.tokenCount ?? 0),
      0,
    );

    const rawPrompt = iterations.find(
      (iteration) => iteration.type === InterationType.FINAL_ANSWER,
    )?.rawPrompt;

    return { executionTime, tokenCount, rawPrompt, iterations };
  }, [spans]);

  if (!enabled || !data) return null;

  const { tokenCount, executionTime, rawPrompt } = data;
  return {
    overall: { tokenCount, executionTime, rawPrompt },
    steps: data.iterations
      .filter(({ type }) => type === InterationType.TOOL)
      .map(({ groupId, executionTime, tokenCount, rawPrompt }) => ({
        stepId:
          runTraceData?.iterations.find(
            ({ event }) => event.group_id === groupId,
          )?.id ?? '',
        data: {
          executionTime,
          tokenCount,
          rawPrompt,
        },
      })),
  };
}

function loadNestedSpans(span: TraceSpan, spans: TraceSpan[]): TraceSpan[] {
  const nestedSpans = spans.filter(
    (nestedSpan) => nestedSpan.parent_id === span.context.span_id,
  );
  return nestedSpans.length > 0
    ? [
        span,
        ...nestedSpans.map((nestedSpan) => loadNestedSpans(nestedSpan, spans)),
      ].flat()
    : [span];
}
