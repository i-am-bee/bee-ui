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

import { breakpoints } from '@carbon/layout';
import { useMediaQuery } from 'usehooks-ts';

type BreakpointKey = keyof typeof breakpoints;

type Breakpoint = `${BreakpointKey}${`Up` | `Down`}`;

const queries = (Object.keys(breakpoints) as BreakpointKey[]).reduce(
  (acc, key) => {
    const { width } = breakpoints[key];
    const [, value, unit] = width.match(/^(\d+)([a-z]+)$/) as RegExpMatchArray;

    return {
      ...acc,
      [`${key}Up`]: `min-width: ${parseInt(value)}${unit}`,
      [`${key}Down`]: `max-width: ${parseInt(value) - 0.02}${unit}`,
    };
  },
  {},
) as { [k in Breakpoint]: string };

export function useBreakpoint(breakpoint: Breakpoint) {
  const query = queries[breakpoint];
  const matches = useMediaQuery(`(${query})`);

  return matches;
}
