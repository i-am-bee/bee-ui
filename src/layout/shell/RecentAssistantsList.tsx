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

import { Link } from '@/components/Link/Link';
import { AssistantIcon } from '@/modules/assistants/icons/AssistantIcon';
import { lastAssistantsQuery } from '@/modules/assistants/library/queries';
import { SkeletonIcon, SkeletonText } from '@carbon/react';
import { ArrowRight, Information } from '@carbon/react/icons';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useAppApiContext, useAppContext } from '../providers/AppProvider';
import { getNewSessionUrl } from './NewSessionButton';
import classes from './RecentAssistantsList.module.scss';
import { AssistantBaseIcon } from '@/modules/assistants/icons/AssistantBaseIcon';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { ReadOnlyTooltipContent } from '@/modules/projects/ReadOnlyTooltipContent';
import { useRouter } from 'next-nprogress-bar';

interface Props {
  enableFetch: boolean;
}

export function RecentAssistantsList({ enableFetch }: Props) {
  const {
    assistant: usedAssistant,
    project,
    isProjectReadOnly,
  } = useAppContext();
  const { selectAssistant } = useAppApiContext();
  const router = useRouter();

  const { data: recentAssistants, isLoading } = useQuery({
    ...lastAssistantsQuery(project.id),
    enabled: enableFetch,
  });

  return (
    <div className={classes.root}>
      <ul className={classes.list}>
        {recentAssistants?.map((assistant) => (
          <li key={assistant.id}>
            <Link
              href={getNewSessionUrl(project.id, assistant)}
              className={clsx(classes.button, {
                [classes.active]: assistant.id === usedAssistant?.id,
              })}
              onClick={() => {
                selectAssistant(assistant);
              }}
            >
              <AssistantIcon
                assistant={assistant}
                size="lg"
                className={classes.icon}
              />

              <span className={classes.name}>{assistant.name}</span>
            </Link>
          </li>
        ))}

        <li key="new">
          <button
            className={clsx(classes.button, classes.newButton)}
            onClick={() => router.push(`/${project.id}/builder`)}
            disabled={isProjectReadOnly}
          >
            <AssistantBaseIcon
              size="lg"
              className={clsx(classes.icon)}
              name="BeeOutline"
            />
            <span className={classes.name}>New bee</span>
            {isProjectReadOnly && (
              <Tooltip
                content={<ReadOnlyTooltipContent entityName="bee" />}
                placement="right"
                asChild
              >
                <Information />
              </Tooltip>
            )}
          </button>
        </li>

        {isLoading
          ? Array.from({ length: 3 }, (_, i) => <SkeletonItem key={i} />)
          : undefined}
      </ul>

      <Link href={`/${project.id}`} className={classes.link}>
        <span>
          <span>All bees in&nbsp;</span>
          <span className={classes.linkProject}>{project.name}</span>
        </span>

        <ArrowRight />
      </Link>
    </div>
  );
}

function SkeletonItem() {
  return (
    <li>
      <div className={classes.button}>
        <SkeletonIcon className={classes.icon} />

        <SkeletonText />
      </div>
    </li>
  );
}
