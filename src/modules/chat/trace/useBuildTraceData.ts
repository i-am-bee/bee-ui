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
import {
  listSpansQuery,
  MAX_TRACE_RETRY_COUNT,
  readTraceQuery,
} from './queries';
import { readRunTraceQuery } from '../queries';
import { InterationType, TraceSpan } from '@/app/observe/api/types';
import {
  getLastNewTokenSpan,
  getGeneratedTokenCountSafe,
  getExecutionTime,
} from './utils';
import { useEffect, useMemo, useState } from 'react';
import { GENERATE_EVENT_TOOL_START, TraceData } from './types';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props {
  enabled: boolean;
  threadId?: string;
  runId?: string;
}

export function useBuildTraceData({ enabled, threadId, runId }: Props): {
  traceData: TraceData | null;
  traceError?: Error;
} {
  const [hasFailed, setHasFailed] = useState(false);
  const { project, organization } = useProjectContext();
  const computedEnabled = !hasFailed && Boolean(enabled && threadId && runId);

  const { data: runTraceData } = useQuery({
    ...readRunTraceQuery(
      organization.id,
      project.id,
      threadId ?? '',
      runId ?? '',
    ),
    enabled: computedEnabled,
  });

  const {
    data: traceData,
    error,
    failureCount,
  } = useQuery({
    ...readTraceQuery(organization.id, project.id, runTraceData?.id ?? ''),
    enabled: Boolean(runTraceData?.id && computedEnabled),
  });

  useEffect(() => {
    if (error && failureCount > MAX_TRACE_RETRY_COUNT) setHasFailed(true);
  }, [error, failureCount]);

  const { data: traceSpans } = useQuery({
    ...listSpansQuery(organization.id, project.id, runTraceData?.id ?? ''),
    enabled: Boolean(!error && traceData?.result.id),
  });

  const spans = traceSpans?.results;

  const data = useMemo(() => {
    if (!spans) return null;
    const iterations = spans
      .filter((span) => span.name.includes('iteration-'))
      .map((span) => {
        return {
          span,
          children: loadNestedSpans(span, spans).flat(),
        };
      })
      .filter((span) => span.children.length >= 1)
      .map((iteration) => {
        const customEventData = iteration.children.find(
          (span) => span.attributes.name === 'startCustom',
        )?.attributes.data;
        const rawPrompt = customEventData?.rawPrompt
          ? String(customEventData.rawPrompt)
          : undefined;

        return {
          groupId: iteration.span.name,
          executionTime: getExecutionTime(iteration.children),
          tokenCount: getGeneratedTokenCountSafe(
            getLastNewTokenSpan(iteration.children),
          ),
          rawPrompt,
          type: iteration.children.find(
            (span) => span.attributes.name === GENERATE_EVENT_TOOL_START,
          )
            ? InterationType.TOOL
            : InterationType.FINAL_ANSWER,
        };
      });

    const executionTime = getExecutionTime(spans);

    // load token count from iterations if they exist. Otherwise, compute it from all spans.
    const tokenCount =
      iterations.reduce(
        (tokenCount, iteration) => tokenCount + (iteration?.tokenCount ?? 0),
        0,
      ) || getGeneratedTokenCountSafe(getLastNewTokenSpan(spans));

    const rawPrompt = iterations.find(
      (iteration) => iteration.type === InterationType.FINAL_ANSWER,
    )?.rawPrompt;

    return { executionTime, tokenCount, rawPrompt, iterations };
  }, [spans]);

  if (error && failureCount > MAX_TRACE_RETRY_COUNT)
    return { traceError: error, traceData: null };

  if (!enabled || !data) return { traceData: null };

  const { tokenCount, executionTime, rawPrompt } = data;
  return {
    traceData: {
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
    },
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
