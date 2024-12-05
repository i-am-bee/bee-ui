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

import { StoreSlice } from '../types';

export type UserMetadata = {
  email?: string;
  tou_accepted_at?: number;
  onboarding_completed_at?: number;
};

export type UserProfileState = {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  metadata?: UserMetadata;
  default_organization: string;
  default_project: string;
};

export type UserProfileAction = {
  setUserProfile: (userProfile: UserProfileState) => void;
  setMetadata: (metadata?: UserMetadata) => void;
};

export type UserProfileSlice = StoreSlice<UserProfileState, UserProfileAction>;
