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

import { useMessageFeedback } from '@/modules/chat/providers/MessageFeedbackProvider';
import { fadeProps } from '@/utils/fadeProps';
import { IconButton } from '@carbon/react';
import {
  ThumbsDown,
  ThumbsDownFilled,
  ThumbsUp,
  ThumbsUpFilled,
} from '@carbon/react/icons';
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  useDismiss,
  useFloating,
  useId,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { AnimatePresence, motion } from 'framer-motion';
import classes from './MessageFeedback.module.scss';
import { MessageFeedbackForm } from './MessageFeedbackForm';

interface Props {
  btnWrapperClasses?: string;
}

export function MessageFeedback({ btnWrapperClasses }: Props) {
  const id = useId();

  const {
    run,
    onVoteClick,
    currentVote,
    form: {
      formState: { isSubmitting },
    },
    formOpen,
    setFormOpen,
    closeForm,
  } = useMessageFeedback();

  const { refs, floatingStyles, context } = useFloating({
    placement: 'right',
    open: formOpen,
    onOpenChange: (nextOpen) => {
      if (nextOpen) {
        setFormOpen(nextOpen);
      } else {
        closeForm();
      }
    },
    whileElementsMounted: autoUpdate,
    middleware: [offset(OFFSET), flip()],
  });

  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    dismiss,
    role,
  ]);

  return (
    <>
      <div className={btnWrapperClasses}>
        <IconButton
          label="I like this response"
          kind="ghost"
          size="sm"
          align="bottom"
          onClick={() => {
            onVoteClick('up');
          }}
          disabled={!run || isSubmitting}
        >
          {currentVote === 'up' ? <ThumbsUpFilled /> : <ThumbsUp />}
        </IconButton>
      </div>

      <div className={btnWrapperClasses}>
        <IconButton
          label="I dislike this response"
          kind="ghost"
          size="sm"
          align="bottom"
          disabled={!run || isSubmitting}
          {...getReferenceProps({
            onClick: () => {
              onVoteClick('down');
            },
          })}
        >
          {currentVote === 'down' ? <ThumbsDownFilled /> : <ThumbsDown />}
        </IconButton>

        <div ref={refs.setReference} className={classes.ref} />

        <AnimatePresence>
          {formOpen && (
            <FloatingPortal>
              <div
                ref={refs.setFloating}
                style={floatingStyles}
                {...getFloatingProps()}
              >
                <motion.div
                  {...fadeProps()}
                  key={`${id}:root`}
                  className={classes.dialog}
                >
                  <MessageFeedbackForm />
                </motion.div>
              </div>
            </FloatingPortal>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

const OFFSET = {
  mainAxis: 24,
};
