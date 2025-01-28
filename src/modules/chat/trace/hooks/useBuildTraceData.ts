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

import { InterationType, TraceSpan } from '@/app/observe/api/types';
import { useEffect, useMemo, useState } from 'react';
import { useRunTrace } from '../../api/queries/useRunTrace';
import { MAX_TRACE_RETRY_COUNT } from '../api';
import { useListSpans } from '../api/queries/useListSpans';
import { useTrace } from '../api/queries/useTrace';
import { GENERATE_EVENT_TOOL_START, TraceData } from '../types';
import {
  getExecutionTime,
  getGeneratedTokenCountSafe,
  getLastNewTokenSpan,
  getRawPrompt,
} from '../utils';

interface Props {
  enabled: boolean;
  threadId?: string;
  runId?: string;
}

export function useBuildTraceData({
  enabled: enabledProp,
  threadId,
  runId,
}: Props): {
  traceData: TraceData | null;
  traceError?: Error;
} {
  const [hasFailed, setHasFailed] = useState(false);
  const enabled = !hasFailed && enabledProp;

  const { data: runTraceData } = useRunTrace({ threadId, runId, enabled });

  const {
    data: traceData,
    error,
    failureCount,
  } = useTrace({ id: runTraceData?.id, enabled });

  useEffect(() => {
    if (error && failureCount > MAX_TRACE_RETRY_COUNT) setHasFailed(true);
  }, [error, failureCount]);

  const { data: traceSpans } = useListSpans({
    traceId: runTraceData?.id,
    enabled: Boolean(!error && traceData?.result.id),
  });

  const spans = traceSpans?.results;

  const data = useMemo(() => {
    if (!spans) return null;
    const iterations = spans
      .filter((span) => span.name.includes('iteration-'))
      .map((span) => ({
        span,
        children: loadNestedSpans(span, spans).flat(),
      }))
      .filter((span) => span.children.length >= 1)
      .map((iteration) => ({
        groupId: iteration.span.name,
        executionTime: getExecutionTime(iteration.children),
        tokenCount: getGeneratedTokenCountSafe(
          getLastNewTokenSpan(iteration.children),
        ),
        rawPrompt: getRawPrompt(iteration.children),
        type: iteration.children.find(
          (span) => span.attributes.name === GENERATE_EVENT_TOOL_START,
        )
          ? InterationType.TOOL
          : InterationType.FINAL_ANSWER,
      }));

    const executionTime = getExecutionTime(spans);

    // load token count from iterations if they exist. Otherwise, compute it from all spans.
    const tokenCount =
      iterations.reduce(
        (tokenCount, iteration) => tokenCount + (iteration?.tokenCount ?? 0),
        0,
      ) || getGeneratedTokenCountSafe(getLastNewTokenSpan(spans));

    // load rawPrompt from iterations if they exist. Otherwise, compute it from all spans.
    const rawPrompt =
      iterations.find(
        (iteration) => iteration.type === InterationType.FINAL_ANSWER,
      )?.rawPrompt || getRawPrompt(spans);

    return { executionTime, tokenCount, rawPrompt, iterations };
  }, [spans]);

  if (error && failureCount > MAX_TRACE_RETRY_COUNT)
    return { traceError: error, traceData: null };

  if (!enabledProp || !data) return { traceData: null };

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
