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
import { useUserSetting } from '@/layout/hooks/useUserSetting';
import { isNotNull } from '@/utils/helpers';
import { ActionableNotification, Button } from '@carbon/react';
import { ChevronDown } from '@carbon/react/icons';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { SourcesView } from '../layout/SourcesView';
import { useChat } from '../providers/ChatProvider';
import {
  ExpandedStepProvider,
  useExpandedStep,
  useExpandedStepActions,
} from '../providers/ExpandedStepProvider';
import { runStepsQuery } from '../queries';
import { BotChatMessage } from '../types';
import { PlanView } from './PlanView';
import classes from './PlanWithSources.module.scss';
import { updatePlanWithRunStep } from './utils';
import { TraceData } from '../trace/types';
import { useBuildTraceData } from '../trace/useBuildTraceData';
import { TraceInfoView } from '../trace/TraceInfoView';
import { TraceDataProvider } from '../trace/TraceDataProvider';
import { FeatureName, isFeatureEnabled } from '@/utils/isFeatureEnabled';
import { useAppContext } from '@/layout/providers/AppProvider';
import { Spinner } from '@/components/Spinner/Spinner';

interface Props {
  message: BotChatMessage;
  trace?: TraceData;
  inView?: boolean;
}

function PlanWithSourcesComponent({ message, inView }: Props) {
  const { project, organization } = useAppContext();
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
  } = useQuery({
    ...runStepsQuery(
      organization.id,
      project.id,
      thread?.id ?? '',
      message.run_id ?? '',
      {
        limit: 100,
      },
    ),
    enabled: Boolean(!message.plan && thread && message.run_id && inView),
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
      isFeatureEnabled(FeatureName.Observe) &&
      Boolean(debugMode && !message.pending && inView),
    runId: message.run_id,
    threadId: thread?.id,
  });

  useEffect(() => {
    setShowButton(!debugMode && !plan.pending);
  }, [debugMode, plan.pending]);

  useEffect(() => {
    setIsOpen(
      debugMode
        ? debugMode
        : message.plan &&
            ((message.plan.pending && !messageHasContent) ||
              (!message.plan.pending && messageHasContent)),
    );
  }, [debugMode, message.plan, messageHasContent]);

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
            filtered: !(expandedStep !== null) || steps.includes(expandedStep),
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
