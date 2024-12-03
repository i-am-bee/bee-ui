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
