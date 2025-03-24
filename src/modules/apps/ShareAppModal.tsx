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
import { ModalBody, ModalHeader } from '@carbon/react';
import { ShareApp } from './ShareApp';
import { Artifact } from './types';

interface Props extends ModalProps {
  artifact: Artifact;
  onSuccess?: (artifact: Artifact) => void;
}

export function ShareAppModal({ artifact, onSuccess, ...props }: Props) {
  return (
    <Modal {...props}>
      <ModalHeader>
        <h2>Share</h2>
      </ModalHeader>

      <ModalBody>
        <ShareApp artifact={artifact} onSuccess={onSuccess} />
      </ModalBody>
    </Modal>
  );
}
