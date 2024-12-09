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
