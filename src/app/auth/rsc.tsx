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

import 'server-only';
import { defaultUserProfileState } from '@/store/user-profile';
import { JWT } from 'next-auth/jwt';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { SIGN_IN_PAGE, auth } from '.';

const DUMMY_JWT_TOKEN = process.env.DUMMY_JWT_TOKEN!;

export const getSession = cache(async () => {
  return await auth();
});

export const ensureSession = async () => {
  if (DUMMY_JWT_TOKEN)
    return {
      user: {
        access_token: DUMMY_JWT_TOKEN,
      },
      userProfile: defaultUserProfileState,
    };

  const session = await getSession();

  if (!session) {
    redirect(`${SIGN_IN_PAGE}?error=unauthenticated`);
  }
  return session;
};

export const ensureAccessToken = async () => {
  const session = await ensureSession();
  const { access_token } = session.user as JWT;
  return access_token;
};
