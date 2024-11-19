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
import { usePrefetchVectorStores } from '@/modules/knowledge/hooks/usePrefetchVectorStores';
import { usePrefetchTools } from '@/modules/tools/hooks/usePrefetchTools';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import { usePathname } from 'next/navigation';
import { useAppContext } from '../providers/AppProvider';
import classes from './MainNav.module.scss';

export function MainNav() {
  const { project } = useAppContext();
  const pathname = usePathname();
  const prefetchTools = usePrefetchTools({ useDefaultParams: true });
  const prefetchVectoreStores = usePrefetchVectorStores({
    useDefaultParams: true,
  });

  const ITEMS = [
    {
      label: 'Bees',
      href: `/${project.id}`,
    },
    {
      label: 'Tools',
      href: `/${project.id}/tools`,
      prefetchData: prefetchTools,
    },
    {
      label: 'Knowledge',
      href: `/${project.id}/knowledge`,
      featureName: FeatureName.Knowledge,
      prefetchData: prefetchVectoreStores,
    },
  ];

  return (
    <nav>
      <ul className={classes.list}>
        {ITEMS.filter(
          ({ featureName }) => !featureName || isFeatureEnabled(featureName),
        ).map(({ label, href, prefetchData }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              onMouseEnter={() => prefetchData?.()}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
