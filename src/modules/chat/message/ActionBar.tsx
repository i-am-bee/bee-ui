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

import { fadeProps } from '@/utils/fadeProps';
import { CopyButton, IconButton, InlineLoading } from '@carbon/react';
import { Reset } from '@carbon/react/icons';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useId } from 'react';
import { useRetry } from '../hooks/useRetry';
import { useChat } from '../providers/chat-context';
import { useMessageFeedback } from '../providers/MessageFeedbackProvider';
import { ChatMessage } from '../types';
import classes from './ActionBar.module.scss';
import { MessageFeedback } from './feedback/MessageFeedback';

interface Props {
  message: ChatMessage;
  visible: boolean;
  isPast?: boolean;
  className?: string;
}

export function ActionBar({ message, visible, isPast, className }: Props) {
  const id = useId();
  const { pending, retry, isDeleting } = useRetry(message);
  const { assistant } = useChat();

  const { formOpen } = useMessageFeedback();

  return (
    <AnimatePresence>
      {(visible || formOpen) && (
        <motion.aside
          {...fadeProps()}
          key={`${id}:root`}
          aria-label="message actions"
          className={clsx(className, classes.root)}
        >
          <>
            <MessageFeedback btnWrapperClasses={classes.btnWrapper} />

            <div className={classes.btnWrapper}>
              <CopyButton
                kind="ghost"
                size="sm"
                autoAlign
                aria-label="Copy"
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                }}
              />
            </div>

            {!isPast && (
              <div className={classes.btnWrapper}>
                <IconButton
                  label="Regenerate"
                  align="bottom"
                  kind="ghost"
                  size="sm"
                  autoAlign
                  onClick={retry}
                  disabled={pending || isDeleting || assistant.isDeleted}
                >
                  {isDeleting ? <InlineLoading /> : <Reset />}
                </IconButton>
              </div>
            )}
          </>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
