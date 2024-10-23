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

import { AssistantPlanStep, StepToolCall } from '@/app/api/threads-runs/types';
import { ExpandPanel } from '@/components/ExpandPanel/ExpandPanel';
import { ExpandPanelButton } from '@/components/ExpandPanelButton/ExpandPanelButton';
import { LineClampText } from '@/components/LineClampText/LineClampText';
import { Spinner } from '@/components/Spinner/Spinner';
import { useAppContext } from '@/layout/providers/AppProvider';
import {
  getToolApprovalId,
  getToolIcon,
  getToolName,
} from '@/modules/tools/utils';
import { isNotNull } from '@/utils/helpers';
import { Button } from '@carbon/react';
import {
  CheckmarkFilled,
  ErrorOutline,
  WarningFilled,
} from '@carbon/react/icons';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import JSON5 from 'json5';
import {
  ReactElement,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { useChat } from '../providers/ChatProvider';
import {
  useExpandedStep,
  useExpandedStepActions,
} from '../providers/ExpandedStepProvider';
import { useRunContext } from '../providers/RunProvider';
import { useTraceData } from '../trace/TraceDataProvider';
import { TraceInfoView } from '../trace/TraceInfoView';
import classes from './PlanStep.module.scss';
import { toolQuery } from './queries';

interface Props {
  step: AssistantPlanStep;
  toolCall: StepToolCall;
}

export function PlanStep({ step, toolCall }: Props) {
  const id = useId();
  const triggerId = `${id}:trigger`;
  const panelId = `${id}:panel`;

  // const { run } = useRunContext();
  // const { assistant } = useChat();
  const { project } = useAppContext();
  const { trace } = useTraceData();

  const stepTrace = useMemo(
    () => trace?.steps.find(({ stepId }) => stepId === step.id),
    [step.id, trace?.steps],
  );

  const status = getStepStatus(step);

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
        : { type: toolKey };

  // const toolApproval = (
  //   run?.status === 'requires_action' &&
  //   run.required_action?.type === 'submit_tool_approvals'
  //     ? run.required_action.submit_tool_approvals.tool_calls
  //     : []
  // )
  //   .map((tool) => ({
  //     id: tool.id,
  //     toolId: getToolApprovalId(tool),
  //     type: tool.type,
  //   }))
  //   .find((toolApproval) => toolApproval.toolId === tool.id);

  const [toolName, setToolName] = useState(getToolName(tool));
  const [userToolId, setUserToolId] = useState('');
  const ToolIcon = toolKey ? getToolIcon(tool) : null;

  const expandedStep = useExpandedStep();
  const { setExpandedStep } = useExpandedStepActions();
  const expanded = expandedStep === step.id;

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

  const { data: userTool } = useQuery({
    ...toolQuery(project.id, userToolId),
    enabled: !!userToolId,
  });

  useEffect(() => {
    setUserToolId(toolCall.type === 'user' ? toolCall.toolId : '');
  }, [toolCall]);

  useEffect(() => {
    if (userTool) {
      setToolName(userTool.name);
    }
  }, [userTool]);

  // useEffect(() => {
  //   if (toolApproval) {
  //     setExpandedStep(step.id);
  //   }
  // }, [toolApproval, step.id, setExpandedStep]);

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
          <h3 className={classes.caption}>{toolCall.caption}</h3>
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
              {/* {toolApproval && (
                <div>
                  <p className={clsx(classes.label, classes.approvalLabel)}>
                    <span>{assistant.data?.name} wants to use</span>
                    <span className={classes.tool}>
                      {ToolIcon && (
                        <span className={classes.toolIcon}>
                          <ToolIcon />
                        </span>
                      )}

                      <strong>{toolName}</strong>
                    </span>
                  </p>

                  <div className={classes.approvalActions}>
                    <Button size="md" kind="secondary">
                      Always allow
                    </Button>

                    <Button size="md" kind="tertiary">
                      Allow once
                    </Button>

                    <Button size="md" kind="tertiary">
                      Decline
                    </Button>
                  </div>
                </div>
              )} */}

              {step.thought && (
                <div>
                  <p className={classes.label}>Thought</p>
                  <p className={classes.value}>{step.thought}</p>
                </div>
              )}

              <div>
                <p className={classes.label}>Tool</p>
                <p className={classes.tool}>
                  {ToolIcon && (
                    <span className={classes.toolIcon}>
                      <ToolIcon />
                    </span>
                  )}

                  <span>{toolName}</span>
                </p>
              </div>

              {input && (
                <div>
                  <p className={classes.label}>Input</p>
                  <div className={classes.result}>
                    <LineClampText numberOfLines={2} code={input}>
                      {input}
                    </LineClampText>
                  </div>
                </div>
              )}

              {errorOrResult && (
                <div>
                  <p className={classes.label}>Result</p>
                  <div className={classes.result}>
                    <LineClampText numberOfLines={4} code={errorOrResult}>
                      {errorOrResult}
                    </LineClampText>
                  </div>
                </div>
              )}

              {stepTrace && <TraceInfoView data={stepTrace.data} />}
            </div>
          )}
        </ExpandPanel>
      </section>
    </li>
  );
}

type ExtendedStepStatus =
  | Exclude<AssistantPlanStep['status'], undefined>
  | 'unknown';

const getStepStatus = (step: AssistantPlanStep): ExtendedStepStatus => {
  return step.status ?? 'unknown';
};

const STEP_STATUS_ICON: Record<ExtendedStepStatus, ReactElement> = {
  completed: <CheckmarkFilled size={16} aria-label="finished" />,
  in_progress: <Spinner aria-label="executing" />,
  unknown: <WarningFilled size={16} aria-label="unknown" />,
  failed: <WarningFilled size={16} aria-label="failed" />,
  cancelled: <ErrorOutline size={16} aria-label="cancelled" />,
};

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
