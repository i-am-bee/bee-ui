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
import { ToastNotification, usePrefix } from '@carbon/react';
import {
  createContext,
  PropsWithChildren,
  ReactNode,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { v4 as uuid } from 'uuid';
import classes from './ToastProvider.module.scss';

interface Toast {
  /**
   * Provide a description for "close" icon button that can be read by screen readers
   */
  ariaLabel?: string;
  caption?: string;
  children?: ReactNode;
  hideCloseButton?: boolean;
  kind?:
    | 'error'
    | 'info'
    | 'info-square'
    | 'success'
    | 'warning'
    | 'warning-alt';
  lowContrast?: boolean;
  role?: 'alert' | 'log' | 'status';
  /** Provide a description for "status" icon that can be read by screen readers */
  statusIconDescription?: string;
  subtitle?: string;
  /** Specify an optional duration the notification should be closed in */
  timeout?: number;
  title?: string;
  apiError?: string;
}

interface ToastContextValue {
  addToast: (toast: Toast) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: noop,
});

interface ToastWithKey extends Toast {
  key: string;
}

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastWithKey[]>([]);
  const prefix = usePrefix();
  const toastPrefix = `${prefix}--toast-notification`;

  const addToast = useCallback(
    (toast: Toast) => {
      setToasts((existing) => {
        const key = uuid();
        const caption = new Date().toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        return [{ caption, ...toast, key }, ...existing];
      });
    },
    [setToasts],
  );

  const contextValue = useMemo(() => ({ addToast }), [addToast]);
  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className={classes.toasts}>
        {toasts.map(({ key, caption, subtitle, apiError, ...toast }) => (
          <ToastNotification
            key={key}
            {...toast}
            onClose={() => {
              setToasts((existing) =>
                existing.filter((toast) => toast.key !== key),
              );
            }}
          >
            <div className={`${toastPrefix}__subtitle`}>
              {subtitle && <div className={classes.subtitle}>{subtitle}</div>}
              {apiError && <div className={classes.apiError}>{apiError}</div>}
            </div>
            <div className={`${toastPrefix}__caption`}>{caption}</div>
          </ToastNotification>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = use(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}
