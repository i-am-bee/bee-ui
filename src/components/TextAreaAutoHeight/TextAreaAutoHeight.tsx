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
  TextareaHTMLAttributes,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { mergeRefs } from 'react-merge-refs';
import classes from './TextAreaAutoHeight.module.scss';

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value'>;

export const TextAreaAutoHeight = forwardRef<HTMLTextAreaElement, Props>(
  function TextAreaAutoHeight({ className, onChange, ...rest }, ref) {
    const [value, setValue] = useState(rest.defaultValue ?? '');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleInput = useCallback((event: Event) => {
      setValue((event.target as HTMLTextAreaElement).value);
    }, []);

    useEffect(() => {
      textareaRef.current?.addEventListener('input', handleInput);

      return () =>
        textareaRef.current?.removeEventListener('input', handleInput);
    });

    return (
      <div
        className={clsx(classes.root, className)}
        data-replicated-value={value}
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
