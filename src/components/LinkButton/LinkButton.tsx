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

import clsx from 'clsx';
import {
  ButtonHTMLAttributes,
  ComponentType,
  ElementType,
  ReactNode,
} from 'react';
import classes from './LinkButton.module.scss';

interface BaseProps {
  className?: string;
  children?: ReactNode;
  icon?: ComponentType<{ size?: number | string }>;
  size?: 'sm' | 'md' | 'lg';
  as?: ElementType;
}

type Props = BaseProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps>;

/**
 * A button that looks like a link
 */
export function LinkButton({
  className,
  as: BaseComponent,
  icon: Icon,
  size = 'md',
  children,
  ...props
}: Props) {
  const classList = clsx(className, classes.root, classes[`size-${size}`], {
    [classes.withIcon]: !!Icon,
  });

  if (BaseComponent)
    return (
      <BaseComponent role="button" {...props} className={classList}>
        {children}
        {Icon && <Icon size={ICON_SIZE[size]} />}
      </BaseComponent>
    );

  return (
    <button type="button" {...props} className={classList}>
      {children}
      {Icon && <Icon size={ICON_SIZE[size]} />}
    </button>
  );
}

const ICON_SIZE = { sm: 16, md: 18, lg: 20 };
