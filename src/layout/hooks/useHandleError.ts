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

import { UnauthenticatedError } from '@/app/api/errors';
import { commonRoutes } from '@/routes';
import { useRouter } from 'next-nprogress-bar';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { useToast } from '../providers/ToastProvider';

interface QueryMetaData {
  toast?: false | { title?: string; includeErrorMessage?: boolean };
}

export function useHandleError() {
  const { addToast } = useToast();
  const router = useRouter();
  const pathname = usePathname()!;

  const handleError = useCallback(
    (err: unknown, opts: QueryMetaData = {}) => {
      if (err instanceof UnauthenticatedError) {
        router.replace(
          commonRoutes.signIn({ params: { callbackUrl: pathname } }),
        );
      } else if (opts.toast !== false) {
        addToast({
          title: opts.toast?.title ?? 'An error occurred',
          subtitle:
            err instanceof Error && opts.toast?.includeErrorMessage
              ? err.message
              : undefined,
          timeout: 10000,
        });
      } else {
        console.error(err);
      }
    },
    [addToast, pathname, router],
  );
  return handleError;
}
