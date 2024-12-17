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

import { useMemo } from 'react';
import classes from './RunSetupDelta.module.scss';
import { RunSetup } from '@/modules/assistants/builder/Builder';
import { ThreadRun } from '@/app/api/threads-runs/types';
import { getToolReferenceFromToolUsage } from '@/modules/tools/utils';
import isEqual from 'lodash/isEqual';
import differenceWith from 'lodash/differenceWith';
import { ToolName } from '@/modules/tools/common/ToolName';
import { KnowledgeBaseName } from '@/modules/knowledge/common/KnowledgeBaseName';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

export function RunSetupDelta({
  run,
  nextRunSetup,
}: {
  run: ThreadRun;
  nextRunSetup?: RunSetup;
}) {
  const { organization, project } = useProjectContext();

  const deltaMessages = useMemo(() => {
    const deltaMessages = [];
    if (run.instructions != nextRunSetup?.instructions)
      deltaMessages.push('Instructions updated');

    const tools = run.tools.map(getToolReferenceFromToolUsage);
    const nextRunTools = nextRunSetup?.tools ?? [];
    differenceWith(tools, nextRunTools, isEqual).forEach((tool) =>
      deltaMessages.push(
        <>
          <ToolName organization={organization} project={project} tool={tool} />{' '}
          tool removed
        </>,
      ),
    );
    differenceWith(nextRunTools, tools, isEqual).forEach((tool) =>
      deltaMessages.push(
        <>
          <ToolName organization={organization} project={project} tool={tool} />{' '}
          tool added
        </>,
      ),
    );

    const runResources = run.uiMetadata.resources;
    const assistantVectorStoreId = runResources?.assistant?.vectorStoreId;
    const nextRunAstVectorStoreId =
      nextRunSetup?.resources?.assistant?.vectorStoreId;
    if (assistantVectorStoreId !== nextRunAstVectorStoreId) {
      if (assistantVectorStoreId) {
        deltaMessages.push(
          <>
            <KnowledgeBaseName vectoreStoreId={assistantVectorStoreId} />{' '}
            removed
          </>,
        );
      }
      if (nextRunAstVectorStoreId) {
        deltaMessages.push(
          <>
            <KnowledgeBaseName vectoreStoreId={nextRunAstVectorStoreId} /> added
          </>,
        );
      }
    }

    return deltaMessages;
  }, [run, nextRunSetup, organization, project]);

  if (!deltaMessages.length) return null;

  return (
    <ul className={classes.root}>
      {deltaMessages.map((message, index) => (
        <li key={index}>
          <span>{message}</span>
        </li>
      ))}
    </ul>
  );
}
