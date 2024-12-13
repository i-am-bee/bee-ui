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
