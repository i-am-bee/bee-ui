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

import { Button } from '@carbon/react';
import { Restart } from '@carbon/react/icons';
import classes from './ErrorPage.module.scss';

export interface ErrorPageProps {
  statusCode?: number | string;
  title: string;
  onRetry?: () => void;
}

export function ErrorPage({ statusCode, title, onRetry }: ErrorPageProps) {
  return (
    <div className={classes.root}>
      <div className={classes.content}>
        {statusCode && <span className={classes.error}>{statusCode}</span>}

        <h1>{title}</h1>

        {onRetry && (
          <Button renderIcon={Restart} size="md" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
