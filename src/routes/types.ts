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

import { ONBOARDING_AGENTS_PARAM, ONBOARDING_PARAM } from '@/utils/constants';
import { Optional } from '@tanstack/react-query';

type OmitProject<P> = Omit<P, keyof ProjectBase>;
type WithParams<P = Params> = { params?: P };

export type Params = Record<string, any>;

export type ProjectBase = { projectId: string };
export type ArtifactBase = ProjectBase & { artifactId: string };
export type ThreadBase = ProjectBase & { threadId: string };
export type VectorStoreBase = ProjectBase & { vectorStoreId: string };
export type AssistantBase = ProjectBase & { assistantId: string };
export type ArtifactBuilderBase = Optional<ArtifactBase, 'artifactId'> &
  Optional<ThreadBase, 'threadId'> & {
    clone?: boolean;
  };
export type AssistantBuilderBase = Optional<AssistantBase, 'assistantId'> &
  Optional<ThreadBase, 'threadId'>;

export type SignInRoute = WithParams<{ callbackUrl?: string; error?: string }>;
export type UnauthorizedRoute = WithParams<{ error?: string | null }>;
export type ProjectRoute = ProjectBase &
  WithParams<{
    [ONBOARDING_PARAM]?: boolean;
    [ONBOARDING_AGENTS_PARAM]?: boolean;
  }>;
export type ArtifactsRoute = ProjectBase;
export type ArtifactCloneRoute = ArtifactBase & WithParams<{ token?: string }>;

export type ArtifactRoute = OmitProject<ArtifactBase>;
export type ThreadRoute = OmitProject<ThreadBase>;
export type VectorStoreRoute = OmitProject<VectorStoreBase>;
export type ChatRoute = OmitProject<AssistantBase>;
export type ArtifactBuilderRoute = OmitProject<ArtifactBuilderBase> &
  WithParams<{
    [ONBOARDING_PARAM]?: boolean;
    template?: string;
  }>;
export type AssistantBuilderRoute = OmitProject<AssistantBuilderBase> &
  WithParams<{
    [ONBOARDING_AGENTS_PARAM]?: boolean;
    template?: string;
    duplicate?: boolean;
  }>;
