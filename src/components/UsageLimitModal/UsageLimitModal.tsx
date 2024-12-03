import { ModalProps } from '@/layout/providers/ModalProvider';
import { Modal } from '../Modal/Modal';
import { ModalBody, ModalHeader } from '@carbon/react';

export function UsageLimitModal(props: ModalProps) {
  return (
    <Modal {...props} size="md">
      <ModalHeader title="You've reached your daily usage limit" />
      <ModalBody>
        You’ve been busy as a bee today! It looks like you’ve hit your daily
        limit for now. Come back tomorrow to continue.
      </ModalBody>
    </Modal>
  );
}
