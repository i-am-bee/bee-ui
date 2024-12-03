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

import { FormLabel } from '@carbon/react';
import { WarningFilled } from '@carbon/react/icons';
import clsx from 'clsx';
import { CSSProperties, ReactNode, TextareaHTMLAttributes } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import python from 'react-syntax-highlighter/dist/cjs/languages/hljs/python';
import defaultStyle from 'react-syntax-highlighter/dist/cjs/styles/hljs/default-style';
import classes from './EditableSyntaxHighlighter.module.scss';

const style: { [key: string]: CSSProperties } = {
  ...defaultStyle,
  hljs: {
    display: 'block',
    overflowX: 'auto',
    padding: '1rem',
    background: 'var(--highlight-background)',
    color: 'var(--highlight-color)',
  },
  'hljs-subst': {
    color: 'var(--highlight-subst-color)',
  },
  'hljs-comment': {
    color: 'var(--highlight-comment-color)',
  },
  'hljs-keyword': {
    color: 'var(--highlight-keyword-color)',
    fontWeight: 'bold',
  },
  'hljs-type': {
    color: 'var(--highlight-primary-color)',
  },
  'hljs-string': {
    color: 'var(--highlight-primary-color)',
  },
  'hljs-number': {
    color: 'var(--highlight-primary-color)',
  },
  'hljs-selector-id': {
    color: 'var(--highlight-primary-color)',
  },
  'hljs-selector-class': {
    color: 'var(--highlight-primary-color)',
  },
  'hljs-quote': {
    color: 'var(--highlight-primary-color)',
  },
  'hljs-template-tag': {
    color: 'var(--highlight-primary-color)',
  },
  'hljs-deletion': {
    color: 'var(--highlight-primary-color)',
  },
  'hljs-title': {
    color: 'var(--highlight-primary-color)',
    fontWeight: 'bold',
  },
  'hljs-section': {
    color: 'var(--highlight-primary-color)',
    fontWeight: 'bold',
  },
  'hljs-regexp': {
    color: 'var(--highlight-secondary-color)',
  },
  'hljs-symbol': {
    color: 'var(--highlight-secondary-color)',
  },
  'hljs-variable': {
    color: 'var(--highlight-secondary-color)',
  },
  'hljs-template-variable': {
    color: 'var(--highlight-secondary-color)',
  },
  'hljs-link': {
    color: 'var(--highlight-secondary-color)',
  },
  'hljs-selector-attr': {
    color: 'var(--highlight-secondary-color)',
  },
  'hljs-selector-pseudo': {
    color: 'var(--highlight-secondary-color)',
  },
  'hljs-literal': {
    color: 'var(--highlight-literal-color)',
  },
  'hljs-built_in': {
    color: 'var(--highlight-tertiary-color)',
  },
  'hljs-bullet': {
    color: 'var(--highlight-tertiary-color)',
  },
  'hljs-code': {
    color: 'var(--highlight-tertiary-color)',
  },
  'hljs-addition': {
    color: 'var(--highlight-tertiary-color)',
  },
};

SyntaxHighlighter.registerLanguage('python', python);

interface Props
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  id: string;
  labelText?: ReactNode;
  value: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  readOnly?: boolean;
  // showLineNumbers?: boolean;
}

export function EditableSyntaxHighlighter({
  id,
  labelText,
  value,
  onChange,
  invalid,
  readOnly,
  // showLineNumbers,
  ...props
}: Props) {
  return (
    <div className={classes.root}>
      {labelText && <FormLabel id={id}>{labelText}</FormLabel>}

      <div className={clsx(classes.wrapper, { [classes.invalid]: invalid })}>
        <SyntaxHighlighter
          language="python"
          style={style}
          // TODO: resolve text wrapping
          // showLineNumbers={showLineNumbers}
        >
          {value.at(-1) === '\n' ? `${value} ` : value}
        </SyntaxHighlighter>

        {!readOnly && (
          <textarea
            {...props}
            id={id}
            className={classes.textarea}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            spellCheck="false"
            aria-invalid={invalid || undefined}
          />
        )}

        {invalid && <WarningFilled className={classes.invalidIcon} />}
      </div>
    </div>
  );
}
