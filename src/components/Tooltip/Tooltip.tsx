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

import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  Placement,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';
import { PropsWithChildren, ReactNode, useRef, useState } from 'react';
import classes from './Tooltip.module.scss';

export interface TooltipProps {
  content: ReactNode;
  placement?: Placement;
  size?: 'sm' | 'md';
  asChild?: boolean;
}

export function Tooltip({
  content,
  placement = 'bottom',
  size = 'md',
  asChild,
  children,
}: PropsWithChildren<TooltipProps>) {
  const arrowRef = useRef(null);

  const SIZE = {
    sm: {
      ArrowWidth: 8,
      ArrowHeight: 4,
      Offset: 3,
    },
    md: {
      ArrowWidth: 9,
      ArrowHeight: 7,
      Offset: 5,
    },
  }[size];

  const [isOpen, setIsOpen] = useState(false);

  const { refs, floatingStyles, context } = useFloating({
    placement,
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(SIZE.ArrowHeight + SIZE.Offset),
      flip({
        fallbackAxisSideDirection: 'start',
      }),
      shift(),
      arrow({
        element: arrowRef,
      }),
    ],
  });

  const hover = useHover(context, { move: false, handleClose: safePolygon() });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  const Comp = asChild ? Slot : 'button';

  return (
    <>
      <Comp ref={refs.setReference} {...getReferenceProps()}>
        {children}
      </Comp>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={clsx(classes.root, { [classes[`size-${size}`]]: size })}
            {...getFloatingProps()}
          >
            <div className={classes.content}>{content}</div>

            <FloatingArrow
              ref={arrowRef}
              context={context}
              width={SIZE.ArrowWidth}
              height={SIZE.ArrowHeight}
              className={classes.arrow}
            />
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
