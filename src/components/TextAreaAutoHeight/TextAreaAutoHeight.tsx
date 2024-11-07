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

'use client';

import clsx from 'clsx';
import {
  CSSProperties,
  TextareaHTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { mergeRefs } from 'react-merge-refs';
import classes from './TextAreaAutoHeight.module.scss';
import { spacing } from '@carbon/layout';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'> & {
  maxRows?: number;
  resizable?: boolean;
};

export const TextAreaAutoHeight = forwardRef<HTMLTextAreaElement, Props>(
  function TextAreaAutoHeight(
    { className, resizable, maxRows, onChange, ...rest },
    ref,
  ) {
    const [value, setValue] = useState(rest.defaultValue ?? '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleInput = useCallback((event: Event) => {
      setValue((event.target as HTMLTextAreaElement).value);
    }, []);

    // This is necessary for the auto height to work properly. React does some optimization and ignores custom Event dispatch if the value is unchanged, which happens with react-hook-form.
    useEffect(() => {
      const element = textareaRef.current;

      element?.addEventListener('input', handleInput);

      return () => element?.removeEventListener('input', handleInput);
    });

    // TODO: add resizable feature

    return (
      <div
        className={clsx(classes.root, className, {
          [classes.resizable]: resizable,
        })}
        data-replicated-value={value}
        style={
          maxRows
            ? ({
                '--max-block-size': `${maxRows * LINE_HEIGHT_REM + 2 * SPACING_04}rem`,
              } as CSSProperties)
            : undefined
        }
      >
        <textarea
          ref={mergeRefs([ref, textareaRef])}
          {...rest}
          onChange={onChange}
        />
      </div>
    );
  },
);

const SPACING_04 = parseInt(`${spacing[4]}`);
const FONT_SIZE_REM = 0.875;
const LINE_HEIGHT_REM = FONT_SIZE_REM * (21 / 14);
