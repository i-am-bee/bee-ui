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
import { useOnboardingCompleted } from '@/modules/users/useOnboardingCompleted';
import { ONBOARDING_PARAM } from '@/utils/constants';
import { useSearchParams } from 'next/navigation';
import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  use,
  useMemo,
  useState,
} from 'react';
import { ARTIFACT_TEMPLATES } from '../onboarding/templates';
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
  const searchParams = useSearchParams();
  const isOnboarding = searchParams?.has(ONBOARDING_PARAM);
  const templateKey = searchParams?.get('template');
  const template = templateKey
    ? ARTIFACT_TEMPLATES.find((template) => template.key === templateKey)
    : undefined;

  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const [artifact, setArtifact] = useState<Artifact | null>(
    initialArtifact ?? null,
  );
  const [code, setCode, codeRef] = useStateWithRef<string | null>(
    initialCode ??
      initialArtifact?.source_code ??
      template?.source_code ??
      null,
  );

  useOnboardingCompleted(isOnboarding ? 'apps' : null);

  const apiValue = useMemo(
    () => ({
      setCode,
      getCode: () => codeRef.current,
      setArtifact,
      setMobilePreviewOpen,
    }),
    [codeRef, setCode, setArtifact, setMobilePreviewOpen],
  );

  return (
    <AppBuilderApiContext.Provider value={apiValue}>
      <AppBuilderContext.Provider value={{ code, artifact, mobilePreviewOpen }}>
        {children}
      </AppBuilderContext.Provider>
    </AppBuilderApiContext.Provider>
  );
}

const AppBuilderContext = createContext<{
  code: string | null;
  artifact: Artifact | null;
  mobilePreviewOpen: boolean;
}>({
  code: null,
  artifact: null,
  mobilePreviewOpen: false,
});

const AppBuilderApiContext = createContext<{
  setCode: (content: string) => void;
  getCode: () => string | null;
  setArtifact: (artifact: Artifact) => void;
  setMobilePreviewOpen: Dispatch<SetStateAction<boolean>>;
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
  return use(AppBuilderContext);
}
