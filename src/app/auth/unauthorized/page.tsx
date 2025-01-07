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

import { LoginError } from '@/modules/auth/SignIn';
import { useMemo, use } from 'react';
import { Unauthorized } from '@/modules/auth/Unauthorized';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default function SignInPage(props: PageProps) {
  const searchParams = use(props.searchParams);
  const errorCode = Array.isArray(searchParams.error)
    ? searchParams.error[0]
    : (searchParams.error ?? null);

  const error: LoginError | null = useMemo(() => {
    switch (errorCode) {
      case 'service_unavailable':
        return {
          kind: 'error',
          title: 'The API server is probably unavailable.',
        };
      default:
        return {
          kind: 'error',
          title:
            "You either requested the resource you're not authorized to access or this could be due to a mismatch in your environment variables on either the API or UI.",
        };
    }
  }, [errorCode]);

  return <Unauthorized error={error} />;
}
