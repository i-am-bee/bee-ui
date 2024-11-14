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
