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
import { Link } from '@/components/Link/Link';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useAppContext } from '@/layout/providers/AppProvider';
import { AppIcon } from '@/modules/apps/AppIcon';
import { AppBuilderNavbarActions } from '@/modules/apps/builder/AppBuilderNavbarActions';
import { AssistantIcon } from '@/modules/assistants/icons/AssistantIcon';
import { getAssistantName } from '@/modules/assistants/utils';
import { ChatNavbarActions } from '@/modules/chat/ChatNavbarActions';
import { ProjectSelector } from '@/modules/projects/ProjectSelector';
import { useRoutes } from '@/routes/useRoutes';
import { useLayout } from '@/store/layout';
import { Button } from '@carbon/react';
import { ArrowLeft } from '@carbon/react/icons';
import { ReactElement, useMemo } from 'react';
import { UserSetting, useUserSetting } from '../hooks/useUserSetting';
import { useNavigationControl } from '../providers/NavigationControlProvider';
import classes from './Navbar.module.scss';
import { SidebarProps } from './Sidebar';
import { SidebarButton } from './SidebarButton';
import { SkipNav } from './SkipNav';

interface Props {
  sidebarId: SidebarProps['id'];
  sidebarOpen: UserSetting['sidebarPinned'];
}

export function Navbar({ sidebarId, sidebarOpen }: Props) {
  const { setUserSetting } = useUserSetting();
  const { onLeaveWithConfirmation } = useNavigationControl();
  const { featureFlags } = useAppContext();
  const { navigate } = useRoutes();
  const navbarProps = useLayout((state) => state.navbarProps);

  const headingItems = useMemo(() => {
    if (!navbarProps) return undefined;

    const { title } = navbarProps;
    let icon;

    switch (navbarProps.type) {
      case 'app-builder':
        icon = navbarProps?.artifact?.uiMetadata.icon;
        return navbarProps.artifact
          ? [
              {
                title: navbarProps.artifact.name,
                icon: icon ? <AppIcon name={icon} /> : null,
              },
            ]
          : [{ title: 'App Builder' }];
      case 'app-detail':
        icon = navbarProps?.artifact?.uiMetadata.icon;
        return (
          navbarProps.artifact && [
            {
              title: navbarProps.artifact.name,
              icon: icon ? <AppIcon name={icon} /> : null,
            },
          ]
        );
      case 'chat':
        return navbarProps.assistant
          ? [
              {
                title: getAssistantName(navbarProps.assistant),
                icon: (
                  <AssistantIcon
                    assistant={navbarProps.assistant ?? null}
                    size="sm"
                  />
                ),
              },
            ]
          : undefined;
      default:
        return title ? [{ title }] : undefined;
    }
  }, [navbarProps]);

  return (
    <header className={classes.root} data-type={navbarProps?.type}>
      <Container size="full" className={classes.container}>
        <SkipNav />

        {navbarProps?.backButton ? (
          <Tooltip
            content={navbarProps.backButton.title ?? 'Back'}
            placement="right"
            asChild
          >
            <Button
              size="sm"
              kind="tertiary"
              onClick={() => {
                if (!navbarProps.backButton) return;

                const { onClick, url } = navbarProps.backButton;
                if (onClick) {
                  onClick();
                } else {
                  onLeaveWithConfirmation({
                    onSuccess: () => navigate(url),
                  });
                }
              }}
              className={classes.backButton}
            >
              <ArrowLeft />
            </Button>
          </Tooltip>
        ) : (
          <SidebarButton
            sidebarId={sidebarId}
            sidebarOpen={sidebarOpen}
            onClick={() => {
              setUserSetting('sidebarPinned', !sidebarOpen);
            }}
          />
        )}

        <NavbarHeading items={headingItems} />

        <div className={classes.actions}>
          {(navbarProps?.type === 'app-builder' ||
            navbarProps?.type === 'app-detail') &&
            navbarProps.artifact && (
              <AppBuilderNavbarActions
                artifact={navbarProps.artifact}
                showShareButton={navbarProps.type === 'app-detail'}
              />
            )}
          {navbarProps?.type === 'chat' && navbarProps.assistant && (
            <ChatNavbarActions assistant={navbarProps.assistant} />
          )}

          {featureFlags.Projects && <ProjectSelector />}
        </div>
      </Container>
    </header>
  );
}

export function NavbarHeading({ items }: { items?: HeadingItem[] }) {
  if (!items?.length) return null;

  return (
    <ul className={classes.heading}>
      {items.map(({ url, title, icon }, key) => (
        <li key={key}>
          {icon}
          <span>{url ? <Link href={url}>{title}</Link> : title}</span>
        </li>
      ))}
    </ul>
  );
}

interface HeadingItem {
  title: string;
  url?: string;
  icon?: ReactElement | null;
}
