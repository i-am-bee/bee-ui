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

import { Modal } from '@/components/Modal/Modal';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import classes from './WaitlistModal.module.scss';
import WaitlistGraphics from './WaitlistGraphics.svg';

const WAITLIST_URL = process.env.NEXT_PUBLIC_WAITLIST_URL;

interface Props extends ModalProps {}

export function WaitlistModal({ ...props }: Props) {
  return (
    <Modal {...props} size="sm">
      <ModalHeader
        className={classes.header}
        closeClassName={classes.closeButton}
      ></ModalHeader>
      <ModalBody>
        <div className={classes.graphics}>
          <WaitlistGraphics />
        </div>
        <h1 className={classes.title}>Join the waitlist</h1>
        <p>
          Bee is buzzing with excitement, and we’re currently at capacity! Sign
          up now to secure your spot and be among the first to gain access when
          we expand. Don’t miss out, join today!
        </p>
      </ModalBody>
      {WAITLIST_URL && (
        <ModalFooter>
          && (
          <Button kind="secondary" href={WAITLIST_URL}>
            Join waitlist
          </Button>
          )
        </ModalFooter>
      )}
    </Modal>
  );
}
