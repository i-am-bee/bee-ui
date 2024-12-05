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

import { FormItem, usePrefix } from '@carbon/react';
import { Checkmark, Edit } from '@carbon/react/icons';
import { PropsWithChildren, ReactNode, useRef, useState } from 'react';
import { useOnClickOutside } from 'usehooks-ts';
import classes from './IconSelectorBase.module.scss';

interface Props {
  baseIcon?: ReactNode;
  size?: 'md' | 'lg';
  disabled?: boolean;
}

export function IconSelectorBase({
  baseIcon,
  size = 'md',
  disabled,
  children,
}: PropsWithChildren<Props>) {
  const prefix = usePrefix();
  const [opened, setOpened] = useState(false);
  const selectorRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(selectorRef, () => {
    setOpened(false);
  });

  return (
    <FormItem>
      <label className={`${prefix}--label`}>Icon</label>
      {disabled ? (
        <div className={classes.root} data-size={size}>
          {baseIcon}
        </div>
      ) : (
        <div className={classes.root} data-size={size} ref={selectorRef}>
          <button
            type="button"
            className={classes.button}
            onClick={() => setOpened((opened) => !opened)}
          >
            {opened ? <Checkmark size={12} /> : <Edit size={12} />}
            {baseIcon}
          </button>

          {/* TODO: animate */}
          {opened && (
            <div className={classes.selector}>
              <div className={classes.selectorContent}>{children}</div>
            </div>
          )}
        </div>
      )}
    </FormItem>
  );
}
