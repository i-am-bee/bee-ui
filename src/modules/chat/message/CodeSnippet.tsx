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

import { Button, CopyButton, Theme } from '@carbon/react';
import { ChevronDown } from '@carbon/react/icons';
import clsx from 'clsx';
import { HTMLAttributes, RefObject, useRef, useState } from 'react';
import useResizeObserver from 'use-resize-observer';
import classes from './CodeSnippet.module.scss';

type Props = HTMLAttributes<HTMLElement>;

export function CodeSnippet(props: Props) {
  const nodeRef = useRef<HTMLElement>(null);
  const { height } = useResizeObserver({
    ref: nodeRef as RefObject<HTMLElement>,
  });
  const isTaller = height != null && height > COLLAPSED_CODE_HEIGHT;
  const [expanded, setExpanded] = useState(false);
  return (
    <Theme
      theme="g100"
      className={clsx(classes.root, { [classes.expanded]: expanded })}
      style={{
        maxBlockSize:
          expanded && height != null
            ? height + EXPANDED_ROOT_BLOCK_PADDING
            : undefined,
      }}
    >
      <div className={classes.copyBtnWrapper}>
        <CopyButton
          className={classes.copyBtn}
          size="sm"
          aria-label="Copy to clipboard"
          onClick={() => {
            const node = nodeRef.current;
            if (node == null || node.textContent == null) return;
            navigator.clipboard.writeText(node.textContent);
          }}
        />
      </div>
      <div className={classes.wrapper}>
        <code ref={nodeRef} {...props} />
      </div>
      {isTaller && (
        <div className={classes.expandBtnWrapper} aria-hidden>
          <Button
            className={classes.expandBtn}
            size="md"
            renderIcon={ChevronDown}
            onClick={() => {
              setExpanded((expanded) => !expanded);
            }}
          >
            {expanded ? 'Show less' : 'Show more'}
          </Button>
        </div>
      )}
    </Theme>
  );
}

const COLLAPSED_CODE_HEIGHT = 56;
const EXPANDED_ROOT_BLOCK_PADDING = 64;
