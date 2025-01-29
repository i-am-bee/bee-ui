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

import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useAppContext } from '@/layout/providers/AppProvider';
import { useModal } from '@/layout/providers/ModalProvider';
import { Button, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { useRouter } from 'next-nprogress-bar';
import { useDeleteArtifact } from '../api/mutations/useDeleteArtifact';
import { ShareAppModal } from '../ShareAppModal';
import { Artifact } from '../types';

interface Props {
  artifact?: Artifact;
  showShareButton?: boolean;
}

export function AppBuilderNavbarActions({ artifact, showShareButton }: Props) {
  const router = useRouter();
  const { project } = useAppContext();
  const { openModal } = useModal();
  const { mutateAsyncWithConfirmation: deleteArtifact } = useDeleteArtifact({
    onSuccess: () => router.push(`/${project.id}/apps/`),
  });

  const isMdDown = useBreakpoint('mdDown');

  if (!artifact) return null;

  return (
    <>
      {showShareButton && (
        <Button
          size="sm"
          kind="tertiary"
          onClick={() =>
            openModal((props) => (
              <ShareAppModal {...props} artifact={artifact} />
            ))
          }
        >
          Share
        </Button>
      )}

      <OverflowMenu size="sm" flipped direction={isMdDown ? 'top' : 'bottom'}>
        <OverflowMenuItem
          itemText="Edit"
          onClick={() =>
            router.push(`/${project.id}/apps/builder/a/${artifact.id}`)
          }
        />
        <OverflowMenuItem
          itemText="Copy to edit"
          onClick={() =>
            router.push(`/${project.id}/apps/builder/clone/${artifact.id}`)
          }
        />
        <OverflowMenuItem
          isDelete
          itemText="Delete"
          onClick={() => deleteArtifact(artifact)}
        />
      </OverflowMenu>
    </>
  );
}
