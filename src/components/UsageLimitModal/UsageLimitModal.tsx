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

import { ModalProps } from '@/layout/providers/ModalProvider';
import { ModalBody, ModalHeader } from '@carbon/react';
import { useState } from 'react';
import { Modal } from '../Modal/Modal';

export function UsageLimitModal(props: ModalProps) {
  const [now] = useState(() => new Date());
  const resetTime = getNewYorkTodayMidnight();
  const isResetToday = now.getDate() === resetTime.getDate();
  const [formatter] = useState(
    () => new Intl.DateTimeFormat('en-US', { hour12: true, hour: 'numeric' }),
  );
  return (
    <Modal {...props} size="md">
      <ModalHeader title="You've reached your daily usage limit" />
      <ModalBody>
        You’ve been busy as a bee today! It looks like you’ve hit your daily
        limit for now. Come back {isResetToday ? '' : 'tomorrow '}
        {`at ${formatter.format(resetTime)}`} to continue.
      </ModalBody>
    </Modal>
  );
}

function getNewYorkTodayMidnight() {
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);

  return new Date(
    Date.UTC(
      tmrw.getFullYear(),
      tmrw.getMonth(),
      tmrw.getDate(),
      -getUtcOffset('America/New_York', -4),
      0,
      0,
      0,
    ),
  );
}

function getUtcOffset(timeZone: string, fallback: number) {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  });

  const parts = formatter.formatToParts(now);
  const timeZoneName = parts.find(
    (part) => part.type === 'timeZoneName',
  )?.value;

  if (timeZoneName) {
    // Parse the offset from the time zone abbreviation (e.g., "GMT-5" or "UTC+2")
    const match = timeZoneName.match(/GMT([+-]\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  console.warn(
    `Unable to get UTC offset for timeZone "${timeZone}", falling back to "UTC${fallback >= 0 ? '+' : '-'}${Math.abs(fallback)}"`,
  );
  return fallback;
}
