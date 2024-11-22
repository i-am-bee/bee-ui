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
import {
  createContext,
  PropsWithChildren,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';

export function AppBuilderProvider({ children }: PropsWithChildren) {
  const [code, setCode] = useState<string | null>(null);

  const apiValue = useMemo(() => ({ setCode }), []);

  return (
    <AppBuilderApiContext.Provider value={apiValue}>
      <AppBuilderContext.Provider value={{ code }}>
        {children}
      </AppBuilderContext.Provider>
    </AppBuilderApiContext.Provider>
  );
}

const AppBuilderContext = createContext<{
  code: string | null;
} | null>(null);

const AppBuilderApiContext = createContext<{
  setCode: (content: string) => void;
} | null>(null);

export function useAppBuilderApi() {
  const context = use(AppBuilderApiContext);

  if (!context) {
    throw new Error(
      'useAppBuilderApi must be used within a AppBuilderProvider',
    );
  }

  return context;
}

export function useAppBuilder() {
  const context = use(AppBuilderContext);

  if (!context) {
    throw new Error('useAppBuilder must be used within a AppBuilderProvider');
  }

  return context;
}
