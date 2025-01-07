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

import { useRouter } from 'next-nprogress-bar';
import { Artifact } from '../types';
import { AppCard } from './AppCard';
import { useProjectContext } from '@/layout/providers/ProjectProvider';
import { USERCONTENT_SITE_URL } from '@/utils/constants';
import { useEffect } from 'react';

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

  // Preload app runtime for faster app startup
  useEffect(() => {
    (async () => {
      fetch(USERCONTENT_SITE_URL, { priority: 'low', mode: 'no-cors' });
      const preload = await (
        await fetch(`${USERCONTENT_SITE_URL}/meta/preload.json`)
      ).json();
      for (const item of preload.items) {
        fetch(
          item.url.startsWith('/')
            ? `${USERCONTENT_SITE_URL}${item.url}`
            : item.url,
          {
            priority: 'low',
            mode: 'no-cors',
            headers: {
              Accept: `${item.contentType}, */*;q=0.01`,
              'Accept-Encoding': '',
            },
          },
        );
      }
    })();
  });

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
