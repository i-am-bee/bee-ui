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
import { PropsWithChildren, createContext, use } from 'react';
import { TraceData } from './types';

const TraceContext = createContext<TraceContextValue>(
  null as unknown as TraceContextValue,
);

type TraceContextValue = {
  traceData: TraceData | null;
  traceError?: Error;
};

interface Props {
  traceData: TraceData | null;
  traceError?: Error;
}

export function TraceDataProvider({
  traceData,
  traceError,
  children,
}: PropsWithChildren<Props>) {
  return (
    <TraceContext.Provider value={{ traceData, traceError }}>
      {children}
    </TraceContext.Provider>
  );
}

export function useTraceData() {
  const context = use(TraceContext);
  if (!context) {
    throw new Error('useTraceData must be used within a TraceDataProvider');
  }

  return context;
}
