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

import { clsx } from 'clsx';
import debounce from 'lodash/debounce';
import {
  ElementType,
  PropsWithChildren,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ExpandButton } from '../ExpandButton/ExpandButton';
import { TextWithCopyButton } from '../TextWithCopyButton/TextWithCopyButton';
import classes from './LineClampText.module.scss';

interface Props {
  numberOfLines: number;
  code?: string | null;
  as?: ElementType;
  className?: string;
}

export function LineClampText({
  children,
  numberOfLines,
  code,
  as: Component = 'p',
  className,
}: PropsWithChildren<Props>) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);

  const checkOverflow = useCallback(() => {
    const element = textRef.current;

    if (!element) {
      return;
    }

    const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
    const height = lineHeight * numberOfLines;
    const { scrollHeight } = element;

    if (scrollHeight === 0) {
      return;
    }

    if (scrollHeight > height) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  }, [numberOfLines]);

  const debouncedCheckOverflow = useMemo(
    () => debounce(checkOverflow, 200),
    [checkOverflow],
  );

  useEffect(() => {
    const element = textRef.current;

    if (!element) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      debouncedCheckOverflow();
    });

    resizeObserver.observe(element);
    checkOverflow();

    return () => {
      if (element) {
        resizeObserver.unobserve(element);
      }
    };
  }, [checkOverflow, debouncedCheckOverflow]);

  const content = (
    <span
      ref={textRef}
      id={id}
      className={classes.clamped}
      style={
        expanded
          ? {}
          : {
              WebkitLineClamp: numberOfLines,
            }
      }
    >
      {children}
    </span>
  );

  return (
    <div className={clsx(classes.root, className)}>
      {code ? (
        <TextWithCopyButton isCode text={code}>
          {content}
        </TextWithCopyButton>
      ) : (
        <Component>{content}</Component>
      )}

      {showButton && (
        <div className={classes.button}>
          <ExpandButton
            onClick={() => setExpanded((expanded) => !expanded)}
            aria-controls={id}
            aria-expanded={expanded}
          >
            {expanded ? 'View less' : 'View all'}
          </ExpandButton>
        </div>
      )}
    </div>
  );
}
