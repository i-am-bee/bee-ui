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
import {
  CONFIRM_MESSAGE_DEFAULT,
  useNavigationControl,
} from '@/layout/providers/NavigationControlProvider';
import { useRouter } from 'next-nprogress-bar';
import NextLink from 'next/link';
import { startTransition } from 'react';

type Props = Omit<
  Parameters<typeof NextLink>[0],
  'passHref' | 'legacyBehaviour'
>;

/**
 * A custom Link component that wraps Next.js's next/link component and
 * utilizes NavigationControlContext to show the confirmation before the
 * route change, when needed.
 */
export function Link({ href, children, replace, onClick, ...rest }: Props) {
  const router = useRouter();
  const { isBlocked, confirmMessage } = useNavigationControl();

  return (
    <NextLink
      href={href}
      data-disable-nprogress={true}
      onClick={(e) => {
        e.preventDefault();

        // Cancel navigation
        if (
          isBlocked &&
          !window.confirm(confirmMessage ?? CONFIRM_MESSAGE_DEFAULT)
        ) {
          return;
        }

        onClick?.(e);

        startTransition(() => {
          const url = href.toString();
          if (replace) {
            router.replace(url, undefined, { showProgressBar: true });
          } else {
            router.push(url, undefined, { showProgressBar: true });
          }
        });
      }}
      {...rest}
    >
      {children}
    </NextLink>
  );
}
