import { useRouter } from 'next-nprogress-bar';
import { Artifact } from '../types';
import { AppCard } from './AppCard';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props {
  artifacts?: NonNullable<Artifact>[];
  isLoading: boolean;
  pageSize?: number;
  onDeleteSuccess: (artifact: Artifact) => void;
}

export function AppsList({
  artifacts,
  isLoading,
  pageSize = PAGE_SIZE,
  onDeleteSuccess,
}: Props) {
  const { project } = useProjectContext();
  const router = useRouter();

  return (
    <>
      {artifacts?.map((artifact) => (
        <AppCard
          key={artifact.id}
          artifact={artifact}
          cta="Use app"
          onDeleteSuccess={onDeleteSuccess}
          onClick={() => {
            router.push(`/${project.id}/apps/${artifact.id}`);
          }}
        />
      ))}

      {isLoading &&
        Array.from({ length: pageSize }, (_, i) => (
          <AppCard.Skeleton key={i} />
        ))}
    </>
  );
}

const PAGE_SIZE = 6;
