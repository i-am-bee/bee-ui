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

import { lens } from '@dhmk/zustand-lens';
import { useStore } from '..';
import { StoreSelector } from '../types';
import { UserProfileSlice, UserProfileState } from './types';

export const dummyUserProfileState: UserProfileState = {
  id: '',
  name: 'Test User',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
};

export const userProfileSlice = (initialState?: Partial<UserProfileState>) =>
  lens<UserProfileSlice>((set, get) => ({
    ...({} as UserProfileState),
    ...initialState,
    actions: {
      setUserProfile: (userProfile) => set(userProfile),
    },
  }));

export const useUserProfile: StoreSelector<UserProfileState> = (selector) =>
  useStore((state) => selector(state.userProfile));

export const useUserProfileActions = () =>
  useStore((state) => state.userProfile.actions);
