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

import {
  CONFIRM_MESSAGE_DEFAULT,
  useNavigationControl,
} from '@/layout/providers/NavigationControlProvider';
import { moderate02 } from '@carbon/motion';
import { ComposedModal } from '@carbon/react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import {
  HTMLAttributes,
  KeyboardEventHandler,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import classes from './Modal.module.scss';

type Props = {
  rootClassName?: string;
  /** Specify an optional className to be applied to the modal root node */
  className?: string;
  /** Specify an optional className to be applied to the modal node */
  containerClassName?: string;
  /**
   * Specify whether the primary button should be replaced with danger button.
   * Note that this prop is not applied if you render primary/danger button by yourself
   */
  danger?: boolean;
  /** Specify whether or not the Modal content should have any inner padding. */
  isFullWidth?: boolean;
  /**
   * Specify an optional handler for the `onKeyDown` event. Called for all
   * `onKeyDown` events that do not close the modal
   */
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
  preventCloseOnClickOutside?: boolean;
  /**
   * Specify a CSS selector that matches the DOM element that should be
   * focused when the Modal opens
   */
  selectorPrimaryFocus?: string;
  /**
   * Specify the CSS selectors that match the floating menus
   */
  selectorsFloatingMenus?: string[];
  /** Specify the size variant. */
  size?: 'xs' | 'sm' | 'md' | 'lg';

  /** True if modal is open */
  isOpen: boolean;
  /** Called when modal requests to be closed, you should update isOpen prop there to false */
  onRequestClose?: () => void;
  /** Called when modal finished closing and unmounted from DOM */
  onAfterClose?: () => void;
  children: ReactNode;
} & Omit<
  HTMLAttributes<HTMLDivElement>,
  | 'className'
  | 'role'
  | 'aria-hidden'
  | 'onBlur'
  | 'onMouseDown'
  | 'onKeyDown'
  | 'onDrag'
  | 'onDragEnd'
  | 'onDragStart'
  | 'onAnimationStart'
>;

/**
 * Wrapper around carbon ComposedModal component that's not mounted when modal is not open
 */
export function Modal({
  isOpen,
  onRequestClose,
  onAfterClose,
  rootClassName,
  ...props
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const [visible, setVisible] = useState(false);
  const { isBlocked, confirmMessage } = useNavigationControl();

  useEffect(() => {
    setVisible(isOpen);
  }, [isOpen]);

  const handleRequestClose = () => {
    if (
      isBlocked &&
      !window.confirm(confirmMessage ?? CONFIRM_MESSAGE_DEFAULT)
    ) {
      return false;
    }

    onRequestClose?.();
  };

  const handleAfterClose = () => {
    onAfterClose?.();
  };

  return (
    <AnimatePresence onExitComplete={handleAfterClose}>
      {isOpen && (
        <motion.div
          key={`${id}:root`}
          variants={{
            hidden: {
              opacity: 0,
              transition: { duration: 0, delay: parseInt(moderate02) / 1000 },
            },
            visible: {
              opacity: 1,
              transition: { duration: 0 },
            },
          }}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onAnimationStart={() => {
            // Hack to provide fade out animation of modal on close
            if (visible) {
              ref.current?.classList.remove('is-visible');
            }
          }}
          onAnimationComplete={() => {
            if (isOpen) {
              const elementToFocus = ref?.current?.querySelector(
                '[data-modal-primary-focus="true"]',
              ) as HTMLElement;
              elementToFocus?.focus?.();
            }
          }}
          className={clsx(classes.root, rootClassName)}
        >
          <ComposedModal
            ref={ref}
            {...props}
            open={visible}
            onClose={handleRequestClose}
            className={clsx(classes.modal, props.className)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
