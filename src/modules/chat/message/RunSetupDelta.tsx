import { useMemo } from 'react';
import classes from './RunSetupDelta.module.scss';
import { RunSetup } from '@/modules/assistants/builder/Builder';
import { ThreadRun } from '@/app/api/threads-runs/types';
import { getToolReferenceFromToolUsage } from '@/modules/tools/utils';
import isEqual from 'lodash/isEqual';
import differenceWith from 'lodash/differenceWith';
import { ToolName } from '@/modules/tools/common/ToolName';
import { KnowledgeBaseName } from '@/modules/knowledge/common/KnowledgeBaseName';

export function RunSetupDelta({
  run,
  nextRunSetup,
}: {
  run: ThreadRun;
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
  }, [nextRunSetup, run]);

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
