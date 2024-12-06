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

import { ONBOARDING_PARAM } from '@/utils/constants';
import { redirect } from 'next/navigation';
import { ensureSession } from '../auth/rsc';

export default async function AppsPage() {
  const session = await ensureSession();
  const { onboarding_completed_at: onboardingCompletedAt } =
    session.userProfile.metadata ?? {};

  const { default_project: defaultProject } = session.userProfile;

  redirect(
    `/${defaultProject}${!Boolean(onboardingCompletedAt) ? `?${ONBOARDING_PARAM}` : ''}`,
  );
}
