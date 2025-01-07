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

import { AppShell } from '@/layout/shell/AppShell';
import { PropsWithChildren } from 'react';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function ProjectLayout(props: PropsWithChildren<Props>) {
  const params = await props.params;

  const { projectId } = params;

  const { children } = props;

  return <AppShell projectId={projectId}>{children}</AppShell>;
}
