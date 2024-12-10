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

import { Link } from '@/components/Link/Link';
import { useAssistantsCount } from '@/modules/assistants/hooks/useAssistantsCount';
import { usePrefetchAssistants } from '@/modules/assistants/hooks/usePrefetchAssistants';
import { usePrefetchVectorStores } from '@/modules/knowledge/hooks/usePrefetchVectorStores';
import { useVectorStoresCount } from '@/modules/knowledge/hooks/useVectorStoresCount';
import { usePrefetchTools } from '@/modules/tools/hooks/usePrefetchTools';
import { useToolsCount } from '@/modules/tools/hooks/useToolsCount';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import { usePathname } from 'next/navigation';
import { useAppContext } from '../providers/AppProvider';
import classes from './MainNav.module.scss';
import { useArtifactsTotalCount } from '@/modules/apps/hooks/useArtifactsTotalCount';

export function MainNav() {
  const pathname = usePathname();

  const { project } = useAppContext();

  const assistantsCount = useAssistantsCount();
  const toolsCount = useToolsCount({ type: ['user'] });
  const vectorStoresCount = useVectorStoresCount();
  const artifactsCount = useArtifactsTotalCount();

  const prefetchAssistants = usePrefetchAssistants({ useDefaultParams: true });
  const prefetchTools = usePrefetchTools({ useDefaultParams: true });
  const prefetchVectoreStores = usePrefetchVectorStores({
    useDefaultParams: true,
  });

  const ITEMS = [
    {
      label: 'Apps',
      href: `/${project.id}`,
      count: artifactsCount,
      prefetchData: prefetchAssistants,
    },
    {
      label: 'Bees',
      href: `/${project.id}/agents`,
      count: assistantsCount,
      prefetchData: prefetchAssistants,
    },
    {
      label: 'Tools',
      href: `/${project.id}/tools`,
      count: toolsCount,
      prefetchData: prefetchTools,
    },
    {
      label: 'Knowledge',
      href: `/${project.id}/knowledge`,
      featureName: FeatureName.Knowledge,
      count: vectorStoresCount,
      prefetchData: prefetchVectoreStores,
    },
  ];

  return (
    <nav>
      <ul className={classes.list}>
        {ITEMS.filter(
          ({ featureName }) => !featureName || isFeatureEnabled(featureName),
        ).map(({ label, href, count, prefetchData }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              onMouseEnter={() => prefetchData()}
            >
              <span>{label}</span>
              {count && <span>{count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
