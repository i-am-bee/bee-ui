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

'use client';

import { noop } from '@/utils/helpers';
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useMemo,
  useState,
} from 'react';

type ExpandedStepState = {
  stepId: string;
  initiator: 'approval' | 'user' | null;
};

const ExpandedStepContext = createContext<ExpandedStepState | null>(null);

type ExpandedStepActionsContextValue = {
  setExpandedStep: Dispatch<SetStateAction<ExpandedStepState | null>>;
};

const ExpandedStepActionsContext =
  createContext<ExpandedStepActionsContextValue>({
    setExpandedStep: noop,
  });

export function ExpandedStepProvider({ children }: PropsWithChildren) {
  const [expandedStep, setExpandedStep] = useState<ExpandedStepState | null>(
    null,
  );

  const stepsActions = useMemo(
    () => ({
      setExpandedStep,
    }),
    [setExpandedStep],
  );

  return (
    <ExpandedStepContext.Provider value={expandedStep}>
      <ExpandedStepActionsContext.Provider value={stepsActions}>
        {children}
      </ExpandedStepActionsContext.Provider>
    </ExpandedStepContext.Provider>
  );
}

export function useExpandedStep() {
  const context = use(ExpandedStepContext);

  return context;
}

export function useExpandedStepActions() {
  const context = use(ExpandedStepActionsContext);

  if (!context) {
    throw new Error(
      'useExpandedStep must be used within a ExpandedStepProvider',
    );
  }

  return context;
}
