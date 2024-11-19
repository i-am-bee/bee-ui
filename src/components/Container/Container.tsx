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
import { forwardRef, HTMLAttributes } from 'react';
import classes from './Container.module.scss';

interface Props extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'lg' | 'full';
}

export const Container = forwardRef<HTMLDivElement, Props>(function Container(
  { size, className, children, ...props },
  ref,
) {
  return (
    <div
      {...props}
      ref={ref}
      className={clsx(
        classes.root,
        {
          [classes[`size-${size}`]]: size,
        },
        className,
      )}
    >
      {children}
    </div>
  );
});
