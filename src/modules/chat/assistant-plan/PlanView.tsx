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

import { AssistantPlan } from '@/app/api/threads-runs/types';
import { fadeProps } from '@/utils/fadeProps';
import { AnimatePresence, motion } from 'framer-motion';
import { useId } from 'react';
import { useTraceData } from '../trace/TraceDataProvider';
import { TraceInfoView } from '../trace/TraceInfoView';
import { PlanStep } from './PlanStep';
import classes from './PlanView.module.scss';

interface Props {
  plan: AssistantPlan;
  show?: boolean;
}

export function PlanView({ plan, show }: Props) {
  const id = useId();
  const { trace } = useTraceData();

  return (
    <AnimatePresence>
      {show && (
        <motion.section
          {...fadeProps()}
          key={`${id}:root`}
          className={classes.root}
          role="status"
        >
          <ol aria-label="plan steps">
            {plan.steps.map((step) =>
              step.toolCalls.map((toolCall) => (
                <PlanStep key={step.id} step={step} toolCall={toolCall} />
              )),
            )}

            <AnimatePresence>
              {trace && (
                <motion.li
                  {...fadeProps()}
                  key={`${id}:trace`}
                  className={classes.trace}
                >
                  <TraceInfoView data={trace.overall} />
                </motion.li>
              )}
            </AnimatePresence>
          </ol>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
