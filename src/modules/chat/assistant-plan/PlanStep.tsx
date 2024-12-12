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

import {
  AssistantPlanStep,
  StepToolCall,
  ThreadRun,
} from '@/app/api/threads-runs/types';
import { Thread } from '@/app/api/threads/types';
import { encodeEntityWithMetadata } from '@/app/api/utils';
import { ExpandPanel } from '@/components/ExpandPanel/ExpandPanel';
import { ExpandPanelButton } from '@/components/ExpandPanelButton/ExpandPanelButton';
import { LineClampText } from '@/components/LineClampText/LineClampText';
import { Spinner } from '@/components/Spinner/Spinner';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';
import { getToolApprovalId } from '@/modules/tools/utils';
import { fadeProps } from '@/utils/fadeProps';
import { isNotNull } from '@/utils/helpers';
import { Button } from '@carbon/react';
import {
  CarbonIconType,
  CheckmarkFilled,
  ErrorFilled,
  ErrorOutline,
  WarningFilled,
} from '@carbon/react/icons';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import JSON5 from 'json5';
import { ReactElement, useCallback, useEffect, useId, useMemo } from 'react';
import { useThreadApi } from '../hooks/useThreadApi';
import { useChat } from '../providers/ChatProvider';
import {
  useExpandedStep,
  useExpandedStepActions,
} from '../providers/ExpandedStepProvider';
import { useRunContext } from '../providers/RunProvider';
import { readRunQuery } from '../queries';
import { useTraceData } from '../trace/TraceDataProvider';
import { TraceInfoView } from '../trace/TraceInfoView';
import { ToolApprovalValue } from '../types';
import classes from './PlanStep.module.scss';
import { useUserSetting } from '@/layout/hooks/useUserSetting';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props {
  step: AssistantPlanStep;
  toolCall: StepToolCall;
  allStepsDone: boolean;
}

export function PlanStep({ step, toolCall, allStepsDone }: Props) {
  const id = useId();
  const triggerId = `${id}:trigger`;
  const panelId = `${id}:panel`;

  const { run } = useRunContext();
  const { assistant, thread, onToolApprovalSubmitRef, setThread } = useChat();
  const { project, organization } = useProjectContext();
  const { traceData, traceError } = useTraceData();

  const queryClient = useQueryClient();

  const { getUserSetting } = useUserSetting();
  const debugMode = getUserSetting('chatDebugMode');

  const {
    updateMutation: { mutate: mutateUpdateThread },
  } = useThreadApi(thread);

  const stepTrace = useMemo(
    () => traceData?.steps.find(({ stepId }) => stepId === step.id),
    [step.id, traceData?.steps],
  );

  const status = getStepStatus(step, run);

  const toolKey = toolCall.type;
  const tool =
    toolKey === 'system'
      ? {
          type: toolKey,
          id: toolCall.toolId,
        }
      : toolKey === 'user'
        ? {
            type: toolKey,
            id: toolCall.toolId,
          }
        : { type: toolKey, id: toolKey };

  const { toolName, toolIcon } = useToolInfo({
    organization,
    project,
    toolReference: tool,
  });
  const ToolIcon = toolKey ? toolIcon : null;

  const expandedStep = useExpandedStep();
  const { setExpandedStep } = useExpandedStepActions();
  const expanded = expandedStep === step.id;

  const toolApproval = (
    run?.status === 'requires_action' &&
    run.required_action?.type === 'submit_tool_approvals'
      ? run.required_action.submit_tool_approvals.tool_calls
      : []
  )
    .map((tool) => ({
      id: tool.id,
      toolId: getToolApprovalId(tool),
      type: tool.type,
    }))
    .find((toolApproval) => toolApproval.toolId === tool.id);

  const handleToolApprovalSubmit = (value: ToolApprovalValue) => {
    if (value === 'always' && thread && toolApproval?.toolId) {
      const metadata = thread.uiMetadata;
      metadata.approvedTools = [
        ...(metadata.approvedTools ?? []),
        toolApproval.toolId,
      ];

      thread.uiMetadata = metadata;
      const updatedThread = encodeEntityWithMetadata<Thread>(thread);
      mutateUpdateThread({ metadata: updatedThread.metadata });
      setThread(thread);
    }

    onToolApprovalSubmitRef.current?.(value);

    queryClient.setQueryData(
      readRunQuery(organization.id, project.id, thread?.id ?? '', run?.id ?? '')
        .queryKey,
      (run) =>
        run
          ? {
              ...run,
              status: 'in_progress' as const,
              required_action: null,
            }
          : undefined,
    );
  };

  const toggleExpand = useCallback(
    (forceOpen?: boolean) =>
      setExpandedStep((expanded) =>
        forceOpen || expanded !== step.id ? step.id : null,
      ),
    [setExpandedStep, step.id],
  );
  const input = maybeParseJson(toolCall.input);
  const result = maybeParseJson(toolCall.result);
  const error = step.lastError ? JSON.stringify(step.lastError, null, 2) : null;
  const errorOrResult = error ?? result;
  const isDetailEnabled = input !== null || step.thought;

  useEffect(() => {
    if (toolApproval) {
      setExpandedStep(step.id);
    }
  }, [toolApproval, step.id, setExpandedStep]);

  return (
    <li className={clsx(classes.root, classes[`step--${status}`])}>
      <section>
        <header className={classes.header}>
          <ExpandPanelButton
            id={triggerId}
            panelId={panelId}
            expanded={expanded}
            disabled={!isDetailEnabled}
            onClick={() => {
              toggleExpand();
            }}
          />
          <div className={classes.tool}>
            {ToolIcon && (
              <span className={classes.toolIcon}>
                <ToolIcon />
              </span>
            )}

            <span>{toolName}</span>
          </div>
          {step.thought && !expanded && (
            <h3 className={classes.thought}>
              “<span>{step.thought}</span>”
            </h3>
          )}
          <span className={classes.status}>{STEP_STATUS_ICON[status]}</span>
        </header>
        <ExpandPanel
          id={panelId}
          triggerId={triggerId}
          expanded={expanded}
          onFocus={() => {
            toggleExpand(true);
          }}
        >
          {isDetailEnabled && (
            <div className={classes.info}>
              {toolApproval ? (
                <div>
                  <div className={clsx(classes.label, classes.approvalLabel)}>
                    <span>{assistant.data?.name} wants to use</span>
                    <span className={classes.tool}>
                      {ToolIcon && (
                        <span className={classes.toolIcon}>
                          <ToolIcon />
                        </span>
                      )}

                      <strong>{toolName}</strong>
                    </span>
                  </div>

                  <div className={classes.approvalActions}>
                    <Button
                      size="md"
                      kind="secondary"
                      onClick={() => handleToolApprovalSubmit('always')}
                    >
                      Always allow
                    </Button>

                    <Button
                      size="md"
                      kind="tertiary"
                      onClick={() => handleToolApprovalSubmit('once')}
                    >
                      Allow once
                    </Button>

                    <Button
                      size="md"
                      kind="tertiary"
                      onClick={() => handleToolApprovalSubmit('decline')}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {step.thought && (
                      <motion.section {...fadeProps()} key={`${id}:thought`}>
                        <>
                          <p className={classes.label}>Thought</p>
                          <p className={classes.value}>{step.thought}</p>
                        </>
                      </motion.section>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {input && (
                      <motion.section {...fadeProps()} key={`${id}:input`}>
                        <>
                          <p className={classes.label}>Input</p>
                          <div className={classes.result}>
                            <LineClampText numberOfLines={2} code={input}>
                              {input}
                            </LineClampText>
                          </div>
                        </>
                      </motion.section>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {errorOrResult && (
                      <motion.section {...fadeProps()} key={`${id}:result`}>
                        <>
                          <p className={classes.label}>Result</p>
                          <div className={classes.result}>
                            <LineClampText
                              numberOfLines={4}
                              code={errorOrResult}
                            >
                              {errorOrResult}
                            </LineClampText>
                          </div>
                        </>
                      </motion.section>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {stepTrace && (
                      <motion.section {...fadeProps()} key={`${id}:trace`}>
                        <TraceInfoView data={stepTrace.data} />
                      </motion.section>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {debugMode &&
                      !traceError &&
                      !stepTrace &&
                      expanded &&
                      allStepsDone && (
                        <motion.section {...fadeProps()} key={`${id}:trace`}>
                          <Spinner />
                        </motion.section>
                      )}
                  </AnimatePresence>
                </>
              )}
            </div>
          )}
        </ExpandPanel>
      </section>
    </li>
  );
}

type ExtendedStepStatus =
  | Exclude<AssistantPlanStep['status'], undefined>
  | 'unknown'
  | 'expired';

const getStepStatus = (
  step: AssistantPlanStep,
  run?: ThreadRun,
): ExtendedStepStatus => {
  if (step.status === 'in_progress' && run?.status === 'expired')
    return 'expired';
  return step.status ?? 'unknown';
};

const STEP_STATUS_ICON: Record<ExtendedStepStatus, ReactElement> = {
  completed: <CheckmarkFilled size={16} aria-label="finished" />,
  in_progress: <Spinner aria-label="executing" />,
  unknown: <WarningFilled size={16} aria-label="unknown" />,
  failed: <StepStatusIcon icon={ErrorFilled} label="Failed" />,
  cancelled: <StepStatusIcon icon={ErrorOutline} label="Cancelled" />,
  expired: <StepStatusIcon icon={ErrorOutline} label="Expired" />,
};

function StepStatusIcon({
  icon: Icon,
  label,
}: {
  icon: CarbonIconType;
  label: string;
}) {
  return (
    <Tooltip content={label} asChild placement="top">
      <Icon size={16} aria-label={label} />
    </Tooltip>
  );
}

const parseJsonLikeString = (string: string): unknown | string => {
  try {
    const json = JSON5.parse(string);

    return json;
  } catch {
    return string;
  }
};

const maybeParseJson = (content: string | null): string | null => {
  if (!isNotNull(content)) {
    return null;
  }

  try {
    const maybeJson = parseJsonLikeString(content);

    if (typeof maybeJson === 'string') {
      return maybeJson;
    }

    return JSON.stringify(maybeJson, null, 2);
  } catch {
    // noop
  }

  return content;
};
