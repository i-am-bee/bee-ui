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

import { useUserProfile } from '@/store/user-profile';
import clsx from 'clsx';
import { HTMLAttributes } from 'react';
import classes from './UserAvatar.module.scss';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  name: string;
}

export function UserAvatar({ name, className }: Props) {
  const initials = getUserInitials(name);

  return <span className={clsx(classes.root, className)}>{initials}</span>;
}

const getUserInitials = (name: string) => {
  if (!name) return '';

  // Names can have unicode characters in them, use unicode aware regex
  const matches = [...name.matchAll(/(\p{L}{1})\p{L}+/gu)];
  const initials = (matches.shift()?.[1] ?? '') + (matches.pop()?.[1] ?? '');
  return initials.toUpperCase();
};

export function CurrentUserAvatar(props: HTMLAttributes<HTMLSpanElement>) {
  const name = useUserProfile((state) => state.name);

  return <UserAvatar {...props} name={name} />;
}
