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

import { AssistantPlan, AssistantPlanStep } from '@/app/api/threads-runs/types';
import { MAX_API_FETCH_LIMIT } from '@/app/api/utils';
import { Spinner } from '@/components/Spinner/Spinner';
import { useUserSetting } from '@/layout/hooks/useUserSetting';
import { useAppContext } from '@/layout/providers/AppProvider';
import { isNotNull } from '@/utils/helpers';
import { ActionableNotification, Button } from '@carbon/react';
import { ChevronDown } from '@carbon/react/icons';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { useListRunSteps } from '../api/queries/useListRunSteps';
import { SourcesView } from '../layout/SourcesView';
import { useChat } from '../providers/chat-context';
import {
  ExpandedStepProvider,
  useExpandedStep,
  useExpandedStepActions,
} from '../providers/ExpandedStepProvider';
import { useBuildTraceData } from '../trace/hooks/useBuildTraceData';
import { TraceDataProvider } from '../trace/TraceDataProvider';
import { TraceInfoView } from '../trace/TraceInfoView';
import { TraceData } from '../trace/types';
import { BotChatMessage } from '../types';
import { PlanView } from './PlanView';
import classes from './PlanWithSources.module.scss';
import { getToolApproval, updatePlanWithRunStep } from './utils';

interface Props {
  message: BotChatMessage;
  trace?: TraceData;
  inView?: boolean;
}

function PlanWithSourcesComponent({ message, inView }: Props) {
  const { featureFlags } = useAppContext();
  const { thread } = useChat();
  const { setExpandedStep } = useExpandedStepActions();
  const expandedStep = useExpandedStep();

  const { getUserSetting } = useUserSetting();
  const debugMode = getUserSetting('chatDebugMode');

  const [showButton, setShowButton] = useState(!debugMode);
  const [isOpen, setIsOpen] = useState(debugMode);
  const [enableFetch, setEnableFetch] = useState(false);

  const messageHasContent = Boolean(message.content);

  const {
    data: stepsData,
    error,
    refetch,
  } = useListRunSteps({
    threadId: thread?.id,
    runId: message.run_id,
    params: {
      limit: MAX_API_FETCH_LIMIT,
    },
    enabled: Boolean(!message.plan && inView),
  });

  const allStepsDone = useMemo(() => {
    const steps = message?.plan?.steps || [];
    return Boolean(
      steps.length > 0 &&
        !steps.some((step) => step.status === 'in_progress') &&
        message.content.length > 0,
    );
  }, [message]);

  const planFromSteps = useMemo(() => {
    const plan: AssistantPlan = { key: uuid(), pending: false, steps: [] };
    stepsData?.data.forEach((step) => {
      updatePlanWithRunStep(step, plan);
    });
    return plan;
  }, [stepsData]);

  const plan = message.plan ?? planFromSteps;
  const sources = getSourcesWithSteps(plan.steps ?? []);

  const { traceData, traceError } = useBuildTraceData({
    enabled:
      featureFlags.Observe && Boolean(debugMode && !message.pending && inView),
    runId: message.run_id,
    threadId: thread?.id,
  });

  useEffect(() => {
    if (isOpen) return;

    const steps = plan.steps || [];
    const hasToolApprovalRequest = steps.some((step) => {
      if (step.status === 'in_progress') {
        const lastToolCall = step.toolCalls.at(-1);
        if (lastToolCall) {
          const toolApproval = getToolApproval(lastToolCall, message.run);
          return Boolean(toolApproval);
        }
      }
      return false;
    });
    if (hasToolApprovalRequest) {
      setIsOpen(true);
    }
  }, [isOpen, message.run, plan.steps]);

  useEffect(() => {
    setShowButton(!debugMode && !plan.pending);
  }, [debugMode, plan.pending]);

  useEffect(() => {
    setIsOpen(
      debugMode
        ? debugMode
        : message.pending &&
            message.plan &&
            ((message.plan.pending && !messageHasContent) ||
              (!message.plan.pending && messageHasContent)),
    );
  }, [debugMode, message.pending, message.plan, messageHasContent]);

  useEffect(() => {
    if (!isOpen) {
      setExpandedStep(null);
    }
  }, [isOpen, setExpandedStep]);

  useEffect(() => {
    if (showButton ? isOpen : inView) {
      setEnableFetch(true);
    }
  }, [showButton, isOpen, inView]);

  if (error)
    return (
      <ActionableNotification
        actionButtonLabel="Try again"
        title="There was an error loading message steps."
        subtitle={error.message}
        hideCloseButton
        kind="error"
        lowContrast
        onActionButtonClick={refetch}
        className={classes.error}
      />
    );

  if (!plan.steps.some((step) => step.toolCalls.length)) {
    const DefaultLoadingComponent =
      message.run_id && debugMode && !traceError && allStepsDone ? (
        <Spinner />
      ) : null;
    return traceData ? (
      <TraceInfoView data={traceData.overall} />
    ) : (
      DefaultLoadingComponent
    );
  }

  return (
    <TraceDataProvider traceData={traceData} traceError={traceError}>
      <div className={clsx(classes.root, { [classes.isOpen]: isOpen })}>
        {showButton && (
          <div className={classes.toggle}>
            <Button
              kind="ghost"
              size="sm"
              onClick={() => setIsOpen((state) => !state)}
              onMouseEnter={() => {
                setEnableFetch(true);
              }}
            >
              <span>How did I get this answer?</span>
              <ChevronDown />
            </Button>
          </div>
        )}

        <PlanView plan={plan} show={isOpen} allStepsDone={allStepsDone} />

        <SourcesView
          sources={sources.map(({ steps, ...props }) => ({
            ...props,
            filtered:
              !(expandedStep !== null) || steps.includes(expandedStep.stepId),
          }))}
          show={isOpen}
          enableFetch={enableFetch}
        />
      </div>
    </TraceDataProvider>
  );
}

export function PlanWithSources(props: Props) {
  return (
    <ExpandedStepProvider>
      <PlanWithSourcesComponent {...props} />
    </ExpandedStepProvider>
  );
}

type SourceWithSteps = {
  url: string;
  steps: string[];
};

const getSourcesWithSteps = (
  steps?: AssistantPlanStep[],
): SourceWithSteps[] => {
  const sourcesMap: { [key: string]: Set<string> } = {};

  steps?.forEach((step) => {
    const sources =
      step.toolCalls?.flatMap((item) => item.sources).filter(isNotNull) ?? [];

    sources.forEach((source) => {
      if (!sourcesMap[source]) {
        sourcesMap[source] = new Set();
      }
      sourcesMap[source].add(step.id);
    });
  });

  const uniqueSourcesWithSteps: SourceWithSteps[] = Object.entries(
    sourcesMap,
  ).map(([url, ids]) => ({
    url,
    steps: Array.from(ids),
  }));

  return uniqueSourcesWithSteps;
};
