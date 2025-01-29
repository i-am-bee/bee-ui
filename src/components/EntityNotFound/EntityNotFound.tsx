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

import { useRoutes } from '@/routes';
import { Button } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import { useMemo } from 'react';
import classes from './EntityNotFound.module.scss';
import AgentNotFound from './agent-not-found.svg';
import AppNotFound from './app-not-found.svg';

interface Props {
  type: 'app' | 'agent';
}

export function EntityNotFound({ type }: Props) {
  const { routes, navigate } = useRoutes();

  const { Icon, button } = useMemo(
    () =>
      ({
        app: {
          Icon: AppNotFound,
          button: {
            label: 'Create your own',
            href: routes.artifactBuilder(),
          },
        },
        agent: {
          Icon: AgentNotFound,
          button: {
            label: 'Back to apps',
            href: routes.artifacts(),
          },
        },
      })[type],
    [type, routes],
  );

  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <Icon className={classes.icon} />

        <h1>Oooh, buzzkill.</h1>

        <p>We couldn’t find the {type} you were looking for.</p>

        <Button kind="secondary" onClick={() => navigate(button.href)}>
          <span>{button.label}</span>
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
