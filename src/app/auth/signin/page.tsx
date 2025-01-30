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

import { LoginError, SignIn } from '@/modules/auth/SignIn';
import { redis, RedisKey } from '@/redis';
import { commonRoutes } from '@/routes';
import { DUMMY_JWT_TOKEN } from '@/utils/constants';
import { isAbsoluteUrl } from '@/utils/url';
import { redirect } from 'next/navigation';
import { signIn } from './actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  let callbackUrl = Array.isArray(searchParams.callbackUrl)
    ? searchParams.callbackUrl[0]
    : searchParams.callbackUrl;
  if (!callbackUrl || isAbsoluteUrl(callbackUrl)) {
    callbackUrl = commonRoutes.home();
  }

  const errorCode = Array.isArray(searchParams.error)
    ? searchParams.error[0]
    : (searchParams.error ?? null);

  if (DUMMY_JWT_TOKEN)
    // user shouldn't be here, let's redirect him to the error page
    redirect(commonRoutes.unauthorized({ params: { error: errorCode } }));

  const error: LoginError | null = (() => {
    switch (errorCode) {
      case null:
        return null;
      case 'unauthorized':
        return {
          kind: 'error',
          title:
            'Access Restricted: Please contact the product team for assistance.',
        };
      case 'unauthenticated':
        return { kind: 'warning', title: 'You are not logged in.' };
      case 'OAuthCreateAccount':
        return { kind: 'error', title: 'Failed to create user account.' };
      case 'service_unavailable':
        return {
          kind: 'error',
          title: 'The API server is probably unavailable.',
        };
      default:
        return { kind: 'error', title: 'Unable to log in.' };
    }
  })();

  const remainingCapacity = await redis.get(RedisKey.REMAINING_CAPACITY);
  const waitlistFull = !!remainingCapacity && parseInt(remainingCapacity) === 0;

  return (
    <SignIn
      error={error}
      action={signIn.bind(null, callbackUrl)}
      showWaitlist={waitlistFull}
      showWaitlistModal={errorCode === 'unauthorized' && waitlistFull}
    />
  );
}
