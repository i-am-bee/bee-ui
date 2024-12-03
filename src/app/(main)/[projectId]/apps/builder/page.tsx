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

import { ensureAppBuilderAssistant } from '@/app/api/rsc';
import { ensureSession } from '@/app/auth/rsc';
import { AppBuilder } from '@/modules/apps/builder/AppBuilder';
import { AppBuilderProvider } from '@/modules/apps/builder/AppBuilderProvider';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function AppsBuilderPage({
  params: { projectId },
}: Props) {
  const session = await ensureSession();
  if (!session) {
    throw new Error('Session not found.');
  }
  const assistant = await ensureAppBuilderAssistant(
    session.userProfile.default_organization,
    projectId,
  );
  if (!assistant) notFound();

  return (
    <LayoutInitializer layout={{ sidebarVisible: false }}>
      <AppBuilderProvider>
        <AppBuilder assistant={assistant} />
      </AppBuilderProvider>
    </LayoutInitializer>
  );
}
