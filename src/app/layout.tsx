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

import { NavigationControlProvider } from '@/layout/providers/NavigationControlProvider';
import { ProgressBarProvider } from '@/layout/providers/ProgressBarProvider';
import { ThemeProvider } from '@/layout/providers/ThemeProvider';
import { ToastProvider } from '@/layout/providers/ToastProvider';
import { StoreProvider } from '@/store/StoreProvider';
import { APP_NAME } from '@/utils/constants';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { PropsWithChildren, ReactNode } from 'react';
import { IncludeGlobalStyles } from './IncludeGlobalStyles';

export const metadata: Metadata = {
  title: `${APP_NAME}`,
  icons: { icon: '//www.ibm.com/favicon.ico' },
};

export default async function RootLayout({
  children,
  modal,
}: PropsWithChildren<{ modal: ReactNode }>) {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  return (
    // suppressHydrationWarning is added because of ThemeProvider
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line react/jsx-no-comment-textnodes */}
        <script nonce={nonce} suppressHydrationWarning>
          /*! For license information please see app.LICENSE.txt */
        </script>
      </head>
      <body>
        <StoreProvider>
          <ThemeProvider nonce={nonce}>
            <ToastProvider>
              <ProgressBarProvider nonce={nonce}>
                <NavigationControlProvider>
                  <IncludeGlobalStyles />

                  {children}
                  {modal}
                </NavigationControlProvider>
              </ProgressBarProvider>
            </ToastProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
