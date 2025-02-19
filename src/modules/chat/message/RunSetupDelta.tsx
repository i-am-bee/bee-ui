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

import { Run } from '@/app/api/threads-runs/types';
import { RunSetup } from '@/modules/assistants/builder/Builder';
import { KnowledgeBaseName } from '@/modules/knowledge/common/KnowledgeBaseName';
import { ToolName } from '@/modules/tools/common/ToolName';
import { getToolReferenceFromToolUsage } from '@/modules/tools/utils';
import differenceWith from 'lodash/differenceWith';
import isEqual from 'lodash/isEqual';
import { useMemo } from 'react';
import classes from './RunSetupDelta.module.scss';

export function RunSetupDelta({
  run,
  nextRunSetup,
}: {
  run: Run;
  nextRunSetup?: RunSetup;
}) {
  const deltaMessages = useMemo(() => {
    const deltaMessages = [];
    if (run.instructions != nextRunSetup?.instructions)
      deltaMessages.push('Instructions updated');

    const tools = run.tools.map(getToolReferenceFromToolUsage);
    const nextRunTools = nextRunSetup?.tools ?? [];
    differenceWith(tools, nextRunTools, isEqual).forEach((tool) =>
      deltaMessages.push(
        <>
          <ToolName tool={tool} /> tool removed
        </>,
      ),
    );
    differenceWith(nextRunTools, tools, isEqual).forEach((tool) =>
      deltaMessages.push(
        <>
          <ToolName tool={tool} /> tool added
        </>,
      ),
    );

    const runResources = run.uiMetadata.resources;
    const assistantVectorStoreId = runResources?.assistant?.vectorStoreId;
    const nextRunVectorStoreId =
      nextRunSetup?.resources?.assistant?.vectorStoreId;
    if (assistantVectorStoreId !== nextRunVectorStoreId) {
      if (assistantVectorStoreId) {
        deltaMessages.push(
          <>
            <KnowledgeBaseName vectoreStoreId={assistantVectorStoreId} />{' '}
            removed
          </>,
        );
      }
      if (nextRunVectorStoreId) {
        deltaMessages.push(
          <>
            <KnowledgeBaseName vectoreStoreId={nextRunVectorStoreId} /> added
          </>,
        );
      }
    }

    return deltaMessages;
  }, [run, nextRunSetup]);

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
