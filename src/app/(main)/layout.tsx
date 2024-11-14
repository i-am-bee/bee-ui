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

import { ModalProvider } from '@/layout/providers/ModalProvider';
import { UserProfileInitializer } from '@/store/user-profile/UserProfileInitializer';
import { SessionProvider } from 'next-auth/react';
import { PropsWithChildren } from 'react';
import { QueryProvider } from '../../layout/providers/QueryProvider';
import { ensureSession } from '../auth/rsc';

export default async function MainLayout({ children }: PropsWithChildren) {
  const session = await ensureSession();

  return (
    <SessionProvider>
      <UserProfileInitializer userProfile={session.userProfile}>
        <QueryProvider>
          <ModalProvider>{children}</ModalProvider>
        </QueryProvider>
      </UserProfileInitializer>
    </SessionProvider>
  );
}
