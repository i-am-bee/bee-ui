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

import { isNotNull } from '@/utils/helpers';
import { ReactNode } from 'react';
import { useUserProfile, useUserProfileActions } from '.';
import { UserProfileState } from './types';

export function UserProfileInitializer({
  userProfile,
  children,
}: {
  userProfile: UserProfileState;
  children: ReactNode;
}) {
  const userId = useUserProfile((state) => state.id) as string | undefined;
  const { setUserProfile } = useUserProfileActions();

  setUserProfile(userProfile);

  return isNotNull(userId) ? children : null;
}
