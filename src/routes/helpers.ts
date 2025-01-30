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

import { isNotNull } from '@/utils/helpers';
import { Params } from './types';

const createParamsQuery = (params?: Params) => {
  if (!params) {
    return '';
  }

  const paramsQuery = Object.entries(params)
    .filter(([, value]) => isNotNull(value) && value !== false)
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');

  return paramsQuery;
};

export const createRoute = <
  T extends string,
  K extends Params | undefined = undefined,
>({
  base,
  params,
}: {
  base: T;
  params?: K;
}) => {
  const paramsQuery = createParamsQuery(params);

  return `${base}${paramsQuery ? `?${paramsQuery}` : ''}` as K extends undefined
    ? T
    : `${T}[?{paramsQuery}]`;
};

export const concatRouteSegments = (segments: (string | undefined)[]) =>
  segments.filter(Boolean).join('');
