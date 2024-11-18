import { useAppContext } from '@/layout/providers/AppProvider';
import { readVectorStoreQuery } from '../queries';
import { useQuery } from '@tanstack/react-query';
import { SkeletonText } from '@carbon/react';
import classes from './KnowledgeBaseName.module.scss';
import { useVectorStore } from '../hooks/useVectorStore';

export function KnowledgeBaseName({
  vectoreStoreId,
}: {
  vectoreStoreId: string;
}) {
  const { data, isLoading } = useVectorStore(vectoreStoreId);

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
