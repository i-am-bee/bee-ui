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

import { CopyButton } from '@carbon/react';
import { PropsWithChildren } from 'react';
import classes from './TextWithCopyButton.module.scss';
import clsx from 'clsx';

interface Props {
  text: string;
  isCode?: boolean;
  className?: string;
}

export function TextWithCopyButton({
  text,
  isCode,
  className,
  children,
}: PropsWithChildren<Props>) {
  return (
    <div className={clsx(classes.root, className)}>
      {isCode ? (
        <code className={classes.content}>{children}</code>
      ) : (
        <div className={classes.content}>{children}</div>
      )}
      <div className={classes.button}>
        <CopyButton
          aria-label="Copy"
          kind="ghost"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(text);
          }}
        />
      </div>
    </div>
  );
}
