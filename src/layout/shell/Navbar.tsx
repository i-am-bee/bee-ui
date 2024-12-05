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

import { Container } from '@/components/Container/Container';
import { UserSetting, useUserSetting } from '../hooks/useUserSetting';
import classes from './Navbar.module.scss';
import { SidebarProps } from './Sidebar';
import { SidebarButton } from './SidebarButton';
import { SkipNav } from './SkipNav';
import { useLayout } from '@/store/layout';
import { AppBuilderNavbarActions } from '@/modules/apps/builder/AppBuilderNavbarActions';
import { ReactElement, useMemo } from 'react';
import { Link } from '@/components/Link/Link';
import { useAppContext } from '../providers/AppProvider';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import { ProjectSelector } from '@/modules/projects/ProjectSelector';

interface Props {
  sidebarId: SidebarProps['id'];
  sidebarOpen: UserSetting['sidebarPinned'];
}

export function Navbar({ sidebarId, sidebarOpen }: Props) {
  const { setUserSetting } = useUserSetting();
  const { project } = useAppContext();
  const navbarProps = useLayout((state) => state.navbarProps);

  const headingItems = useMemo(() => {
    switch (navbarProps?.type) {
      case 'app-builder':
        return navbarProps.artifact
          ? [
              { title: 'Apps', url: `/${project.id}/apps` },
              { title: navbarProps.artifact.name },
            ]
          : [{ title: 'App Builder' }];
      case 'assistant-builder':
        return [{ title: 'Bee builder' }];
      case 'common':
        return [{ title: navbarProps.title ?? '' }];
      default:
        return undefined;
    }
  }, [navbarProps, project]);

  return (
    <header className={classes.root}>
      <Container size="full" className={classes.container}>
        <SkipNav />

        <SidebarButton
          sidebarId={sidebarId}
          sidebarOpen={sidebarOpen}
          onClick={() => {
            setUserSetting('sidebarPinned', !sidebarOpen);
          }}
        />

        <NavbarHeading items={headingItems} />

        <div className={classes.actions}>
          {navbarProps?.type === 'app-builder' && (
            <AppBuilderNavbarActions artifact={navbarProps.artifact} />
          )}

          {isFeatureEnabled(FeatureName.Projects) && <ProjectSelector />}
        </div>
      </Container>
    </header>
  );
}

export function NavbarHeading({ items }: { items?: HeadingItem[] }) {
  if (!items?.length) return null;

  return (
    <ul className={classes.heading}>
      {items.map(({ url, title }, key) => (
        <li key={key}>{url ? <Link href={url}>{title}</Link> : title}</li>
      ))}
    </ul>
  );
}

interface HeadingItem {
  title: string;
  url?: string;
  icon?: ReactElement;
}
