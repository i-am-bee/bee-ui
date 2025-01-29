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
import { useArtifactsCount } from '@/modules/apps/api/queries/useArtifactsCount';
import { usePrefetchArtifacts } from '@/modules/apps/api/queries/usePrefetchArtifacts';
import { useRoutes } from '@/routes/useRoutes';
import { usePathname } from 'next/navigation';
import classes from './MainNav.module.scss';

export function MainNav() {
  const pathname = usePathname();
  const { routes } = useRoutes();

  const artifactsCount = useArtifactsCount();
  const prefetchArtifacts = usePrefetchArtifacts({ useDefaultParams: true });

  const ITEMS = [
    {
      label: 'Apps',
      href: routes.artifacts(),
      count: artifactsCount,
      prefetchData: prefetchArtifacts,
    },
  ];

  return (
    <nav>
      <ul className={classes.list}>
        {ITEMS.map(({ label, href, count, prefetchData }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={pathname === href ? 'page' : undefined}
              onMouseEnter={() => prefetchData()}
            >
              <span className={classes.label}>{label}</span>
              <span className={classes.count}>{count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
