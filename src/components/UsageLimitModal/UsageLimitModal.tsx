import { ModalProps } from '@/layout/providers/ModalProvider';
import { Modal } from '../Modal/Modal';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { useState } from 'react';

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
      <ModalFooter>
        <Button
          kind="secondary"
          onClick={() => {
            props.onRequestClose();
          }}
        >
          Ok
        </Button>
      </ModalFooter>
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
