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

import { Attachment } from '@carbon/react/icons';
import clsx from 'clsx';
import pluralize from 'pluralize';
import classes from './FileCount.module.scss';

interface Props {
  count: number;
  className?: string;
}

export function FileCount({ className, count }: Props) {
  return (
    <span
      className={clsx(classes.root, className)}
      aria-label={`${count} ${pluralize('file', count)}`}
    >
      <Attachment size={12} />

      <span>{count}</span>
    </span>
  );
}
