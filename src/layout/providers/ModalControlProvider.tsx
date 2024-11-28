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

import { noop } from '@/utils/helpers';
import { PropsWithChildren, createContext, use, useState } from 'react';

interface ModalControlContextValue {
  isBlocked: boolean;
  confirmMessage: string | null;
  setConfirmOnRequestClose: (confirmMessage?: string) => void;
  clearConfirmOnRequestClose: () => void;
  onRequestCloseSafe: () => void;
}

const ModalControlContext = createContext<ModalControlContextValue>({
  isBlocked: false,
  confirmMessage: null,
  setConfirmOnRequestClose: noop,
  clearConfirmOnRequestClose: noop,
  onRequestCloseSafe: noop,
});

interface Props {
  onRequestClose: () => void;
}

export function ModalControlProvider({
  onRequestClose,
  children,
}: PropsWithChildren<Props>) {
  const [isBlocked, setBlocked] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const setConfirmOnRequestClose = (confirmMessage?: string) => {
    console.trace();
    setBlocked(true);
    setConfirmMessage(confirmMessage ?? null);
  };

  const clearConfirmOnRequestClose = () => {
    setBlocked(false);
  };

  const handleRequestClose = () => {
    if (
      isBlocked &&
      !window.confirm(confirmMessage ?? CONFIRM_MESSAGE_DEFAULT)
    ) {
      return false;
    }

    onRequestClose?.();
  };

  return (
    <ModalControlContext.Provider
      value={{
        isBlocked,
        confirmMessage,
        setConfirmOnRequestClose,
        clearConfirmOnRequestClose,
        onRequestCloseSafe: handleRequestClose,
      }}
    >
      {children}
    </ModalControlContext.Provider>
  );
}

export function useModalControl() {
  return use(ModalControlContext);
}

export const CONFIRM_MESSAGE_DEFAULT = 'Do you really want to close the form?';
