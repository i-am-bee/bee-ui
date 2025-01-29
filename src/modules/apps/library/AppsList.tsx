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

import { ArtifactDeleteResult } from '@/app/api/artifacts/types';
import { useRoutes } from '@/routes';
import { Artifact } from '../types';
import { AppCard } from './AppCard';

interface Props {
  artifacts?: NonNullable<Artifact>[];
  isLoading: boolean;
  pageSize?: number;
  onDeleteSuccess: (artifact?: ArtifactDeleteResult) => void;
}

export function AppsList({
  artifacts,
  isLoading,
  pageSize = PAGE_SIZE,
  onDeleteSuccess,
}: Props) {
  const { routes, navigate } = useRoutes();

  return (
    <>
      {artifacts?.map((artifact) => (
        <AppCard
          key={artifact.id}
          artifact={artifact}
          cta="Use app"
          onDeleteSuccess={onDeleteSuccess}
          onClick={() => {
            navigate(routes.artifact({ artifactId: artifact.id }));
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
