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

import { Button, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { Artifact } from '../types';
import { useModal } from '@/layout/providers/ModalProvider';
import { useDeleteArtifact } from '../hooks/useDeleteArtifact';
import { useRouter } from 'next-nprogress-bar';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props {
  artifact?: Artifact;
}

export function AppBuilderNavbarActions({ artifact }: Props) {
  const router = useRouter();
  const { project } = useAppContext();
  const { deleteArtifact } = useDeleteArtifact({
    artifact,
    onSuccess: () => router.push(`/${project.id}/apps/`),
  });

  if (!artifact) return null;

  return (
    <>
      <Button size="sm" kind="tertiary">
        Share
      </Button>
      <OverflowMenu size="sm" flipped>
        <OverflowMenuItem
          isDelete
          itemText="Delete"
          onClick={() => deleteArtifact()}
        />
      </OverflowMenu>
    </>
  );
}
