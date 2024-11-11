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

import { LazyModalRenderer } from '@/components/LazyRenderer/LazyModalRenderer';
import { lazy } from 'react';
import { AssistantModalProps } from './AssistantModal';

const AssistantModal = lazy(() => import('./AssistantModal'));

interface Props extends AssistantModalProps {
  isOpened: boolean;
  onModalClose: () => void;
}

export function AssistantModalRenderer({
  isOpened,
  onModalClose,
  ...detailProps
}: Props) {
  return (
    <LazyModalRenderer isOpen={isOpened} onRequestClose={() => onModalClose()}>
      {(props) => <AssistantModal {...props} {...detailProps} />}
    </LazyModalRenderer>
  );
}
