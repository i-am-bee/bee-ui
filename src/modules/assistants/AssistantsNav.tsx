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

import { useFetchNextPageInView } from '@/hooks/useFetchNextPageInView';
import {
  useAppApiContext,
  useAppContext,
} from '@/layout/providers/AppProvider';
import { getNewSessionUrl } from '@/layout/shell/NewSessionButton';
import {
  OverflowMenu,
  OverflowMenuItem,
  SkeletonIcon,
  SkeletonText,
} from '@carbon/react';
import { Add } from '@carbon/react/icons';
import clsx from 'clsx';
import { useRouter } from 'next-nprogress-bar';
import { PropsWithChildren, useState } from 'react';
import { ASSISTANTS_ORDER_DEFAULT } from './AssistantsHome';
import classes from './AssistantsNav.module.scss';
import { AssistantModalRenderer } from './detail/AssistantModalRenderer';
import { useAssistants } from './hooks/useAssistants';
import { AssistantBaseIcon } from './icons/AssistantBaseIcon';
import { Assistant } from './types';

interface Props {
  enableFetch?: boolean;
  className?: string;
}

const PAGE_SIZE = 20;
const INITIAL_SKELETON_COUNT = 1;

export function AssistantsNav({ enableFetch, className }: Props) {
  const params = {
    ...ASSISTANTS_ORDER_DEFAULT,
    limit: PAGE_SIZE,
  };

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetching,
    isPending,
    isFetchingNextPage,
  } = useAssistants({ params, enabled: enableFetch });

  const { ref: fetchMoreAnchorRef } = useFetchNextPageInView({
    onFetchNextPage: fetchNextPage,
    isFetching,
    hasNextPage,
  });

  return (
    <nav className={clsx(classes.root, className)}>
      <ul>
        {data?.assistants.map((assistant) => (
          <AgentLink key={assistant.id} assistant={assistant}>
            {assistant.name}
          </AgentLink>
        ))}

        {(isPending || isFetchingNextPage) &&
          Array.from(
            { length: isFetchingNextPage ? PAGE_SIZE : INITIAL_SKELETON_COUNT },
            (_, i) => <AgentLink.Skeleton key={i} />,
          )}
      </ul>

      {hasNextPage && <div ref={fetchMoreAnchorRef} />}

      <div className={classes.bottom}>
        <NewButton />
      </div>
    </nav>
  );
}

function AgentLink({
  assistant,
  children,
  ...props
}: PropsWithChildren<{ assistant: Assistant }>) {
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [builderModalOpened, setBuilderModalOpened] = useState(false);
  const { selectAssistant } = useAppApiContext();
  const { project, assistant: selectedAssistant } = useAppContext();
  const router = useRouter();

  return (
    <li>
      <div
        {...props}
        className={clsx(classes.item, {
          [classes.focusWithin]: optionsOpen,
          [classes.active]:
            selectedAssistant && selectedAssistant.id === assistant.id,
        })}
      >
        <span className={classes.icon}>
          <AssistantBaseIcon name={assistant.uiMetadata.icon} size="sm" />
        </span>

        <button
          type="button"
          className={classes.button}
          onClick={() => {
            selectAssistant(assistant);
            router.push(getNewSessionUrl(project.id, assistant));
          }}
        >
          {children}
        </button>

        <div className={classes.options}>
          <OverflowMenu
            aria-label="Options"
            size="sm"
            onOpen={() => setOptionsOpen(true)}
            onClose={() => setOptionsOpen(false)}
          >
            <OverflowMenuItem
              itemText="Agent details"
              onClick={() => setBuilderModalOpened(true)}
            />
            <OverflowMenuItem
              itemText="Edit"
              onClick={() => {
                router.push(`/${project.id}/builder/${assistant.id}`);
              }}
            />
            <OverflowMenuItem
              itemText="Copy to edit"
              onClick={() => {
                router.push(`/${project.id}/builder/${assistant.id}?duplicate`);
              }}
            />
          </OverflowMenu>
        </div>
      </div>

      <AssistantModalRenderer
        assistant={assistant}
        isOpened={builderModalOpened}
        onModalClose={() => setBuilderModalOpened(false)}
      />
    </li>
  );
}

AgentLink.Skeleton = function Skeleton() {
  return (
    <li>
      <div className={classes.skeleton}>
        <SkeletonIcon className={classes.icon} />
        <SkeletonText width="50%" />
      </div>
    </li>
  );
};

function NewButton() {
  const { project } = useAppContext();
  const router = useRouter();

  return (
    <button
      type="button"
      className={classes.newButton}
      onClick={() => router.push(`/${project.id}/builder`)}
    >
      <span className={classes.icon}>
        <Add />
      </span>

      <span>New agent</span>
    </button>
  );
}
