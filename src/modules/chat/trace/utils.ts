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

import { SpanDataValueRawWithMeta, TraceSpan } from '@/app/observe/api/types';
import has from 'lodash/has';
import { GENERATE_EVENT_NEW_TOKEN } from './types';

export function isSpanDataValueRawWithMeta(
  value: any,
): value is SpanDataValueRawWithMeta {
  return has(value, 'raw.meta');
}

export function getLastNewTokenSpan(spans: TraceSpan[]) {
  return [...spans]
    .reverse()
    .find((span) => span.attributes.name === GENERATE_EVENT_NEW_TOKEN);
}

export function getGeneratedTokenCountSafe(span?: TraceSpan) {
  if (!span) return null;

  const value = span.attributes.data?.value;
  if (!isSpanDataValueRawWithMeta(value)) return null;

  return value.raw.meta.generated_token_count;
}

export function getExecutionTime(spans: TraceSpan[]) {
  const firstItem = spans.at(0);
  const lastItem = spans.at(-1);
  if (!firstItem || !lastItem) return 0;

  return (
    new Date(lastItem.end_time).getTime() -
    new Date(firstItem.start_time).getTime()
  );
}
