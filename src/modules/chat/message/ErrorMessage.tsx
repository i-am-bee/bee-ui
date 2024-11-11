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

import { ApiError } from '@/app/api/errors';
import { LineClampText } from '@/components/LineClampText/LineClampText';
import { ActionableNotification, Button, InlineLoading } from '@carbon/react';
import clsx from 'clsx';
import { useRetry } from '../hooks/useRetry';
import { ChatMessage } from '../types';
import classes from './ErrorMessage.module.scss';

interface Props {
  error: Error;
  message: ChatMessage;
  hideRetry?: boolean;
  className?: string;
}

export function ErrorMessage({ error, message, hideRetry, className }: Props) {
  const text = message.role === 'user' ? 'Failed to send' : 'An error occurred';

  return (
    <ActionableNotification
      className={clsx(classes.root, className)}
      title={text}
      subtitle={
        !hideRetry ? (
          <RetryButton message={message} className={classes.retryButton} />
        ) : undefined
      }
      kind="error"
      lowContrast
      hideCloseButton
    >
      {(error.cause != null || error.message) && (
        <LineClampText numberOfLines={4} className={classes.message}>
          {getErrorMessage(error, true)}
        </LineClampText>
      )}
    </ActionableNotification>
  );
}

function RetryButton({
  message,
  className,
}: {
  message: ChatMessage;
  className?: string;
}) {
  const { pending, retry, isDeleting } = useRetry(message);
  return isDeleting ? (
    <InlineLoading description="Regenerating..." />
  ) : (
    <Button
      kind="ghost"
      size="sm"
      onClick={retry}
      disabled={pending}
      className={className}
    >
      {message.role === 'user' ? 'Resend' : 'Regenerate'}
    </Button>
  );
}

const getErrorMessage = (error: Error, full?: boolean) => {
  let msg =
    error instanceof ApiError
      ? `ERROR(${error.data.error}): ${error.message}`
      : error.message;
  if (!full) {
    return msg;
  }
  const detail = getErrorDetail(error, 1);
  if (detail) {
    msg += '\n' + detail;
  }

  return msg;
};

const getErrorDetail = (error: Error, existingLinesCount = 0) => {
  if (error.cause == null) {
    return '';
  }

  const toCauseString = (cause: unknown, lines: string[]) => {
    const normalizedCause = getNormalizedError(cause);
    if (normalizedCause) {
      const linesCount = existingLinesCount + lines.length;
      const prefix =
        linesCount > 0 ? `${'\t'.repeat(linesCount)}[cause]: ` : '';
      lines.push(
        prefix + `${normalizedCause.name}: ${normalizedCause.message}`,
      );
      toCauseString(normalizedCause.cause, lines);
    }
  };

  const causeLines: string[] = [];
  toCauseString(error.cause, causeLines);
  return causeLines.join('\n');
};

interface NormalizedError {
  name: string;
  message: string;
  cause?: unknown;
}

const getNormalizedError = (error: unknown): NormalizedError | undefined => {
  if (error == null) return undefined;
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return {
      name:
        'name' in error && typeof error.name === 'string'
          ? error.name
          : 'error' in error && typeof error.error === 'string'
            ? error.error
            : 'Error',
      message: error.message,
      cause: 'cause' in error ? error.cause : undefined,
    };
  }
  return {
    name: 'Error',
    message: String(error),
  };
};
