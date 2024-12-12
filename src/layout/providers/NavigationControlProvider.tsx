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

// components/navigation-block.tsx
'use client';

import {
  PropsWithChildren,
  createContext,
  use,
  useCallback,
  useEffect,
  useState,
} from 'react';

interface NavigationControlContextValue {
  isBlocked: boolean;
  confirmMessage: string | null;
  setConfirmOnPageLeave: (confirmMessage?: string) => void;
  clearConfirmOnPageLeave: () => void;
  onLeaveWithConfirmation: (props: { onSuccess: () => void }) => void;
}

const NavigationControlContext = createContext<NavigationControlContextValue>(
  null as unknown as NavigationControlContextValue,
);

export function NavigationControlProvider({ children }: PropsWithChildren) {
  const [isBlocked, setBlocked] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  const setConfirmOnPageLeave = (confirmMessage?: string) => {
    setBlocked(true);
    setConfirmMessage(confirmMessage ?? null);
  };

  const clearConfirmOnPageLeave = () => {
    setBlocked(false);
    setConfirmMessage(null);
  };

  useEffect(() => {
    if (isBlocked) {
      const showConfirmation = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        return confirmMessage ?? CONFIRM_MESSAGE_DEFAULT;
      };

      window.addEventListener('beforeunload', showConfirmation);
      return () => {
        window.removeEventListener('beforeunload', showConfirmation);
      };
    }
  }, [confirmMessage, isBlocked]);

  const handleLeaveWithConfirmation: NavigationControlContextValue['onLeaveWithConfirmation'] =
    useCallback(
      ({ onSuccess }) => {
        if (
          isBlocked &&
          !window.confirm(confirmMessage ?? CONFIRM_MESSAGE_DEFAULT)
        ) {
          return;
        }

        onSuccess();
      },
      [confirmMessage, isBlocked],
    );

  return (
    <NavigationControlContext.Provider
      value={{
        isBlocked,
        confirmMessage,
        setConfirmOnPageLeave,
        clearConfirmOnPageLeave,
        onLeaveWithConfirmation: handleLeaveWithConfirmation,
      }}
    >
      {children}
    </NavigationControlContext.Provider>
  );
}

export function useNavigationControl() {
  const context = use(NavigationControlContext);

  if (!context) {
    throw new Error(
      'useNavigationControl must be used within a NavigationControlProvider',
    );
  }

  return context;
}

export const CONFIRM_MESSAGE_DEFAULT = 'Do you really want to leave?';
