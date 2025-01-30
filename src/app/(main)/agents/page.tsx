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

import { ensureSession } from '@/app/auth/rsc';
import { commonRoutes } from '@/routes';
import { ONBOARDING_AGENTS_PARAM } from '@/utils/constants';
import isObject from 'lodash/isObject';
import { redirect } from 'next/navigation';

export default async function AgentsOnboardingPage() {
  const session = await ensureSession();
  const { onboarding_section_completed_at: onboardingCompleted } =
    session.userProfile.metadata ?? {};

  const { default_project: defaultProject } = session.userProfile;

  const showOnboarding = !Boolean(
    isObject(onboardingCompleted) && onboardingCompleted.assistants,
  );

  redirect(
    commonRoutes.project({
      projectId: defaultProject,
      params: { [ONBOARDING_AGENTS_PARAM]: showOnboarding },
    }),
  );
}
