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

'use client';

import { ExternalLink } from '@/components/ExternalLink/ExternalLink';
import { Link } from '@/components/Link/Link';
import { CurrentUserAvatar } from '@/components/UserAvatar/UserAvatar';
import { useModal } from '@/layout/providers/ModalProvider';
import { useUserProfile } from '@/store/user-profile';
import { PRIVACY_URL, TOU_TEXT } from '@/utils/constants';
import { isNotNull } from '@/utils/helpers';
import { Button, Popover, PopoverContent } from '@carbon/react';
import { Settings } from '@carbon/react/icons';
import { CODE_ESCAPE } from 'keycode-js';
import { signOut } from 'next-auth/react';
import { KeyboardEventHandler, useId, useMemo, useRef, useState } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import { useAppContext } from '../providers/AppProvider';
import { TermsOfUseModal } from './TermsOfUseModal';
import classes from './UserProfile.module.scss';

export function UserProfile() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { project } = useAppContext();
  const id = useId();

  const { openModal } = useModal();
  const userId = useUserProfile((state) => state.id);
  const name = useUserProfile((state) => state.name);
  const email = useUserProfile((state) => state.email);

  const isDummyUser = userId === '';

  useOnClickOutside(ref, () => {
    setOpen(false);
  });

  const handleKeyDown: KeyboardEventHandler<HTMLSpanElement> = (event) => {
    if (open && event.code === CODE_ESCAPE) {
      setOpen(false);

      buttonRef.current?.focus();
    }
  };

  const menuItems: MenuItem[] = useMemo(
    () =>
      [
        {
          label: 'Preferences',
          href: `/${project.id}/preferences`,
        },
        TOU_TEXT
          ? {
              label: 'Terms of Use',
              onClick: () =>
                openModal((props) => <TermsOfUseModal {...props} />),
            }
          : null,
        PRIVACY_URL
          ? {
              label: 'Privacy Statement',
              href: PRIVACY_URL,
              isExternal: true,
            }
          : null,
      ].filter(isNotNull),
    [openModal, project.id],
  );

  return (
    <Popover
      className={classes.root}
      ref={ref}
      open={open}
      align="right-end"
      caret={false}
      onKeyDown={handleKeyDown}
    >
      <Button
        ref={buttonRef}
        kind="ghost"
        className={classes.button}
        onClick={() => {
          setOpen((state) => !state);
        }}
        aria-expanded={open}
        aria-controls={id}
      >
        {isDummyUser ? (
          <span className={classes.settingsIcon}>
            <Settings />
          </span>
        ) : (
          <CurrentUserAvatar />
        )}
      </Button>

      <PopoverContent id={id}>
        <div className={classes.stack}>
          <header className={classes.user}>
            <CurrentUserAvatar className={classes.userAvatar} />

            <div className={classes.userInfo}>
              <p className={classes.userName}>{name}</p>
              <p className={classes.userEmail}>{email}</p>
            </div>
          </header>

          <nav>
            <ul className={classes.list}>
              {menuItems.map(({ label, href, onClick, isExternal }, index) => {
                const commonProps = {
                  children: label,
                  className: classes.link,
                  onClick: () => {
                    setOpen(false);
                    onClick?.();
                  },
                };

                return (
                  <li key={index}>
                    {href ? (
                      isExternal ? (
                        <ExternalLink href={href} {...commonProps} />
                      ) : (
                        <Link href={href} {...commonProps} />
                      )
                    ) : (
                      <button type="button" {...commonProps} />
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {!isDummyUser && (
            <footer className={classes.footer}>
              <button
                type="button"
                className={classes.link}
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Log out
              </button>
            </footer>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type MenuItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  isExternal?: boolean;
};
