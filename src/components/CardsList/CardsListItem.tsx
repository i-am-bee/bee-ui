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

import { useBreakpoint } from '@/hooks/useBreakpoint';
import {
  OverflowMenu,
  OverflowMenuItem,
  SkeletonIcon,
  SkeletonText,
} from '@carbon/react';
import { ArrowRight, CarbonIconProps } from '@carbon/react/icons';
import clsx from 'clsx';
import {
  ComponentProps,
  ComponentType,
  MouseEventHandler,
  PropsWithChildren,
  ReactElement,
  useState,
} from 'react';
import classes from './CardsListItem.module.scss';

interface Props {
  title?: string | ReactElement;
  cta?: { title: string; icon?: ComponentType<CarbonIconProps> };
  icon?: ReactElement;
  onClick?: MouseEventHandler;
  isDeletePending?: boolean;
  actions?: ComponentProps<typeof OverflowMenuItem>[];
  canHover?: boolean;
  selected?: boolean;
  className?: string;
}

export function CardsListItem({
  icon,
  title,
  cta,
  onClick,
  actions,
  isDeletePending,
  canHover,
  selected,
  className,
  children,
}: PropsWithChildren<Props>) {
  const [optionsOpen, setOptionsOpen] = useState(false);

  const isMaxDown = useBreakpoint('maxDown');

  const Title = () => (
    <h3 className={classes.name}>
      {onClick ? (
        <button type="button" onClick={onClick}>
          {title}
        </button>
      ) : (
        title
      )}
    </h3>
  );

  const CtaIcon = cta?.icon ?? ArrowRight;

  return (
    <article
      className={clsx(classes.root, className, {
        [classes.focusWithin]: optionsOpen,
        [classes.isDeletePending]: isDeletePending,
        [classes.canHover]: canHover,
        [classes.selected]: selected,
      })}
    >
      <div className={classes.header}>
        {icon ? <div className={classes.icon}>{icon}</div> : <Title />}
        {actions && (
          <div className={classes.options}>
            <OverflowMenu
              aria-label="Options"
              size="md"
              onOpen={() => setOptionsOpen(true)}
              onClose={() => setOptionsOpen(false)}
              flipped={isMaxDown}
            >
              {actions.map((props, i) => (
                <OverflowMenuItem {...props} key={i} />
              ))}
            </OverflowMenu>
          </div>
        )}
      </div>

      <div className={classes.body}>
        {icon && <Title />}

        {children}
      </div>

      {cta && (
        <p className={classes.cta}>
          <span className={classes.ctaLabel}>{cta.title}</span>
          <CtaIcon />
        </p>
      )}
    </article>
  );
}

CardsListItem.Skeleton = function Skeleton({
  className,
  hideIcon,
  children,
}: {
  className?: string;
  hideIcon?: boolean;
  children?: ReactElement | ReactElement[];
}) {
  return (
    <article className={clsx(classes.root, className)}>
      {!hideIcon && <SkeletonIcon className={classes.icon} />}

      {children ? (
        children
      ) : (
        <>
          <div className={classes.body}>
            <SkeletonText className={classes.name} width="" />
            <SkeletonText className={classes.description} width="" />
          </div>

          <SkeletonText className={classes.label} width="" />
        </>
      )}
    </article>
  );
};
