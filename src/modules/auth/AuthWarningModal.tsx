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

import { Modal } from '@/components/Modal/Modal';
import { Button, ModalBody, ModalFooter } from '@carbon/react';
import { ErrorFilled, Login } from '@carbon/react/icons';
import { ReactNode } from 'react';
import classes from './AuthWarningModal.module.scss';

interface Props {
  content: ReactNode;
  buttonLabel: string;
}

export function AuthWarningModal({ content, buttonLabel }: Props) {
  return (
    <Modal isOpen size="xs">
      <ModalBody className={classes.body}>
        <div className={classes.icon}>
          <ErrorFilled size={20} />
        </div>
        <p className={classes.text}>{content}</p>
      </ModalBody>
      <ModalFooter>
        <Button
          kind="secondary"
          renderIcon={Login}
          onClick={() => {
            // HACK: I didn't find a way how to "exit" an intercepted route, and render the original one
            window.location.reload();
          }}
        >
          {buttonLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
