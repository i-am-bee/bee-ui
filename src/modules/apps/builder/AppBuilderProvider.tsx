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
import { useStateWithRef } from '@/hooks/useStateWithRef';
import {
  createContext,
  PropsWithChildren,
  use,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Artifact } from '../types';

interface Props {
  code?: string;
  artifact?: Artifact;
}

export function AppBuilderProvider({
  code: initialCode,
  artifact: initialArtifact,
  children,
}: PropsWithChildren<Props>) {
  const [artifact, setArtifact] = useState<Artifact | null>(
    initialArtifact ?? null,
  );
  const [code, setCode, codeRef] = useStateWithRef<string | null>(
    initialCode ?? null,
  );

  const apiValue = useMemo(
    () => ({ setCode, getCode: () => codeRef.current, setArtifact }),
    [codeRef, setCode],
  );

  useEffect(() => {
    if (artifact) setCode(artifact.source_code ?? null);
  }, [artifact, setCode]);

  return (
    <AppBuilderApiContext.Provider value={apiValue}>
      <AppBuilderContext.Provider value={{ code, artifact }}>
        {children}
      </AppBuilderContext.Provider>
    </AppBuilderApiContext.Provider>
  );
}

const AppBuilderContext = createContext<{
  code: string | null;
  artifact: Artifact | null;
} | null>(null);

const AppBuilderApiContext = createContext<{
  setCode: (content: string) => void;
  getCode: () => string | null;
  setArtifact: (artifact: Artifact) => void;
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