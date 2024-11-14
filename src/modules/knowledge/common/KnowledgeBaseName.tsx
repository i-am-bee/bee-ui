import { VectorStore } from '@/app/api/vector-stores/types';
import { useAppContext } from '@/layout/providers/AppProvider';
import { readVectorStoreQuery } from '../queries';
import { useQuery } from '@tanstack/react-query';
import { SkeletonText } from '@carbon/react';
import classes from './KnowledgeBaseName.module.scss';

export function KnowledgeBaseName({
  vectoreStoreId,
}: {
  vectoreStoreId: string;
}) {
  const { project } = useAppContext();
  const { data, isLoading } = useQuery(
    readVectorStoreQuery(project.id, vectoreStoreId),
  );

  if (isLoading) return <KnowledgeBaseName.Skeleton />;

  return data?.name;
}

KnowledgeBaseName.Skeleton = function Skeleton() {
  return (
    <SkeletonText
      width={LOADING_KNOWLEDGE_NAME_WIDTH}
      className={classes.skeleton}
    />
  );
};

const LOADING_KNOWLEDGE_NAME_WIDTH = '5rem';
