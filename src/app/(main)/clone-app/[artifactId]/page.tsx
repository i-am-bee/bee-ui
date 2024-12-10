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

import { fetchArtifact, fetchSharedArtifact } from '@/app/api/artifacts';
import { ensureAppBuilderAssistant } from '@/app/api/rsc';
import { ensureDefaultOrganizationId, ensureSession } from '@/app/auth/rsc';
import { AppBuilder } from '@/modules/apps/builder/AppBuilder';
import { AppBuilderProvider } from '@/modules/apps/builder/AppBuilderProvider';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound, redirect } from 'next/navigation';

interface Props {
  params: {
    artifactId: string;
  };
  searchParams: { token?: string };
}

export default async function CloneAppPage({
  params: { artifactId },
  searchParams: { token },
}: Props) {
  const session = await ensureSession();
  const { default_project: defaultProjectId } = session.userProfile;

  redirect(
    `/${defaultProjectId}/apps/builder/clone/${artifactId}?token=${token}`,
  );
}
