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

import { encodeMetadata } from '@/app/api/utils';
import {
  OnboardingCompletedAt,
  UserMetadata,
} from '@/store/user-profile/types';
import { useUpdateUser } from './useUpdateUser';
import { useOnMount } from '@/hooks/useOnMount';
import { useUserProfile } from '@/store/user-profile';

export function useOnboardingCompleted(section: OnboardingSection | null) {
  const { mutate: updateUserMutate } = useUpdateUser();
  const userMetadata = useUserProfile((state) => state.metadata);

  useOnMount(() => {
    if (section)
      updateUserMutate({
        metadata: encodeMetadata<UserMetadata>({
          ...userMetadata,
          onboarding_section_completed_at: {
            ...userMetadata?.onboarding_section_completed_at,
            [section]: Math.floor(Date.now() / 1000),
          },
        }),
      });
  });
}

export type OnboardingSection = keyof NonNullable<
  UserMetadata['onboarding_section_completed_at']
>;
