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

import { noop } from '@/utils/helpers';
import { Loading } from '@carbon/react';
import { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { FallbackModal } from '../FallbackModal/FallbackModal';
import LazyRenderer from './LazyRenderer';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { ModalControlProvider } from '@/layout/providers/ModalControlProvider';

interface Props {
  isOpen: boolean;
  onRequestClose: () => void;
  onAfterClose?: () => void;
}

interface ExtendedProps extends Props {
  children: (props: ModalProps) => ReactNode;
}

/** Wraps children (intended for react.lazy modal) with a ErrorBoundary and Suspense */
export function LazyModalRenderer({
  isOpen,
  onRequestClose,
  onAfterClose = noop,
  children,
}: ExtendedProps) {
  return (
    <ErrorBoundary
      fallbackRender={(props) => (
        <FallbackModal
          isOpen={isOpen}
          onRequestClose={onRequestClose}
          onAfterClose={noop}
          {...props}
        />
      )}
    >
      <Suspense fallback={<Loading />}>
        {/* Use LazyRenderer to postpone mount of lazy loaded component modal until user opens it for the first time  */}
        <LazyRenderer trigger={isOpen}>
          <ModalControlProvider onRequestClose={onRequestClose}>
            {children({ isOpen, onRequestClose, onAfterClose })}
          </ModalControlProvider>
        </LazyRenderer>
      </Suspense>
    </ErrorBoundary>
  );
}
