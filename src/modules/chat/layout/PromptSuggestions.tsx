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

import { Container } from '@/components/Container/Container';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { decodeStarterQuestionsMetadata } from '@/modules/assistants/utils';
import { fadeProps } from '@/utils/fadeProps';
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import debounce from 'lodash/debounce';
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useChat } from '../providers/ChatProvider';
import classes from './PromptSuggestions.module.scss';

interface Props {
  inputRef: RefObject<HTMLTextAreaElement>;
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: (input: string) => void;
}

export function PromptSuggestions({
  inputRef,
  isOpen,
  setIsOpen,
  onSubmit,
}: Props) {
  const { assistant } = useChat();

  const suggestions = decodeStarterQuestionsMetadata(assistant.data?.metadata);

  const { refs, floatingStyles, context, placement } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
    whileElementsMounted: autoUpdate,
    middleware: [offset(OFFSET), flip()],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePress: (event) => event.target !== inputRef.current,
  });
  const role = useRole(context, { role: 'dialog' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const handleInputClick = (event: MouseEvent) => {
    if (isOpen) {
      return;
    }

    const target = event.target as HTMLTextAreaElement;

    if (target.value === '') {
      setIsOpen(true);
    }
  };

  const handleInputKeyUp = (event: KeyboardEvent) => {
    if (!isOpen) {
      return;
    }

    const target = event.target as HTMLTextAreaElement;

    if (target.value.length > 0) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const inputElement = inputRef.current;

    inputElement?.addEventListener('click', handleInputClick);
    inputElement?.addEventListener('keyup', handleInputKeyUp);

    return () => {
      inputElement?.removeEventListener('click', handleInputClick);
      inputElement?.removeEventListener('keyup', handleInputKeyUp);
    };
  });

  if (suggestions.length === 0) {
    return;
  }

  return (
    <>
      <div
        ref={refs.setReference}
        className={classes.ref}
        {...getReferenceProps()}
      />

      <AnimatePresence>
        {isOpen && (
          <FloatingPortal>
            <Container
              ref={refs.setFloating}
              style={floatingStyles}
              size="sm"
              className={classes.root}
              {...getFloatingProps()}
            >
              <motion.div
                {...fadeProps({
                  hidden: {
                    transform:
                      placement === 'bottom-start'
                        ? 'translateY(-1rem)'
                        : 'translateY(1rem)',
                  },
                  visible: {
                    transform: 'translateY(0)',
                  },
                })}
              >
                <div className={classes.content}>
                  <h3 className={classes.heading}>Suggestions</h3>

                  <ul className={classes.list}>
                    {suggestions.map(({ id, question }) => (
                      <li key={id} className={classes.item}>
                        <SuggestionButton
                          content={question}
                          onSubmit={onSubmit}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </Container>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </>
  );
}

function SuggestionButton({
  content,
  onSubmit,
}: {
  content: string;
  onSubmit: (input: string) => void;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  const checkOverflow = useCallback(() => {
    const element = ref.current;

    if (!element) {
      return;
    }

    const { scrollHeight, clientHeight } = element;

    if (scrollHeight > clientHeight) {
      setIsTruncated(true);
    } else {
      setIsTruncated(false);
    }
  }, []);

  const debouncedCheckOverflow = useMemo(
    () => debounce(checkOverflow, 200),
    [checkOverflow],
  );

  useEffect(() => {
    const element = ref.current;

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
  }, [checkOverflow, debouncedCheckOverflow, isTruncated]);

  const buttonContent = (
    <button
      className={classes.button}
      type="button"
      onClick={() => onSubmit(content)}
    >
      <span ref={ref}>{content}</span>
    </button>
  );

  return isTruncated ? (
    <Tooltip content={content} placement="top" asChild>
      {buttonContent}
    </Tooltip>
  ) : (
    buttonContent
  );
}

const OFFSET = {
  mainAxis: 8,
};
