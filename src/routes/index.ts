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

import { useWorkspace } from '@/layout/providers/WorkspaceProvider';
import { useRouter } from 'next-nprogress-bar';
import { useMemo } from 'react';
import { concatRouteSegments, createRoute } from './helpers';
import {
  ArtifactBase,
  ArtifactBuilderBase,
  ArtifactBuilderRoute,
  ArtifactCloneRoute,
  ArtifactRoute,
  ArtifactsRoute,
  AssistantBase,
  AssistantBuilderBase,
  AssistantBuilderRoute,
  ChatRoute,
  ProjectBase,
  ProjectRoute,
  SignInRoute,
  ThreadBase,
  ThreadRoute,
  UnauthorizedRoute,
  VectorStoreBase,
  VectorStoreRoute,
} from './types';

const base = {
  home: () => '/' as const,
  termsOfUse: () => '/auth/accept-tou' as const,
  signIn: () => '/auth/signin' as const,
  unauthorized: () => '/auth/unauthorized' as const,
  project: ({ projectId }: ProjectBase) => `/${projectId}` as '/${projectId}',
  artifacts: ({ projectId }: ProjectBase) => `/${projectId}` as '/${projectId}',
  artifact: ({ projectId, artifactId }: ArtifactBase) =>
    `/${projectId}/apps/${artifactId}` as '/${projectId}/apps/${artifactId}',
  artifactClone: ({ projectId, artifactId }: ArtifactBase) =>
    `/${projectId}/apps/builder/clone/${artifactId}` as '/${projectId}/apps/builder/clone/${artifactId}',
  thread: ({ projectId, threadId }: ThreadBase) =>
    `/${projectId}/thread/${threadId}` as '/${projectId}/thread/${threadId}',
  tools: ({ projectId }: ProjectBase) =>
    `/${projectId}/tools` as '/${projectId}/tools',
  preferences: ({ projectId }: ProjectBase) =>
    `/${projectId}/preferences` as '/${projectId}/preferences',
  apiKeys: ({ projectId }: ProjectBase) =>
    `/${projectId}/api-keys` as '/${projectId}/api-keys',
  vectorStores: ({ projectId }: ProjectBase) =>
    `/${projectId}/knowledge` as '/${projectId}/knowledge',
  vectorStore: ({ projectId, vectorStoreId }: VectorStoreBase) =>
    `/${projectId}/knowledge/${vectorStoreId}` as '/${projectId}/knowledge/${vectorStoreId}',
  chat: ({ projectId, assistantId }: AssistantBase) =>
    `/${projectId}/chat/${assistantId}` as '/${projectId}/chat/${assistantId}',
  artifactBuilder: ({
    projectId,
    artifactId,
    threadId,
    clone,
  }: ArtifactBuilderBase) =>
    concatRouteSegments([
      `/${projectId}/apps/builder`,
      artifactId && `/${clone ? 'clone' : 'a'}/${artifactId}`,
      threadId && `/t/${threadId}`,
    ]) as '/${projectId}/apps/builder[(/(a|clone)/${artifactId})|(/t/${threadId})]',
  assistantBuilder: ({
    projectId,
    assistantId,
    threadId,
  }: AssistantBuilderBase) =>
    concatRouteSegments([
      `/${projectId}/builder`,
      assistantId && `/${assistantId}`,
      threadId && `/thread/${threadId}`,
    ]) as '/${projectId}/builder[/${assistantId}]',
};

export const commonRoutes = {
  home: () =>
    createRoute({
      base: base.home(),
    }),
  termsOfUse: () =>
    createRoute({
      base: base.termsOfUse(),
    }),
  signIn: ({ params }: SignInRoute = {}) =>
    createRoute({
      base: base.signIn(),
      params,
    }),
  unauthorized: ({ params }: UnauthorizedRoute = {}) =>
    createRoute({
      base: base.unauthorized(),
      params,
    }),
  project: ({ projectId, params }: ProjectRoute) =>
    createRoute({
      base: base.project({ projectId }),
      params,
    }),
  artifacts: ({ projectId }: ArtifactsRoute) =>
    createRoute({
      base: base.artifacts({ projectId }),
    }),
  artifactClone: ({ projectId, artifactId, params }: ArtifactCloneRoute) =>
    createRoute({
      base: base.artifactClone({ projectId, artifactId }),
      params,
    }),
};

export function useRoutes() {
  const { project } = useWorkspace();
  const router = useRouter();

  const projectId = project.id;

  const routes = useMemo(
    () => ({
      ...commonRoutes,
      artifacts: () => commonRoutes.artifacts({ projectId }),
      artifact: ({ artifactId }: ArtifactRoute) =>
        createRoute({
          base: base.artifact({ projectId, artifactId }),
        }),
      thread: ({ threadId }: ThreadRoute) =>
        createRoute({
          base: base.thread({ projectId, threadId }),
        }),
      tools: () =>
        createRoute({
          base: base.tools({ projectId }),
        }),
      preferences: () =>
        createRoute({
          base: base.preferences({ projectId }),
        }),
      apiKeys: () =>
        createRoute({
          base: base.apiKeys({ projectId }),
        }),
      vectorStores: () =>
        createRoute({
          base: base.vectorStores({ projectId }),
        }),
      vectorStore: ({ vectorStoreId }: VectorStoreRoute) =>
        createRoute({
          base: base.vectorStore({ projectId, vectorStoreId }),
        }),
      chat: ({ assistantId }: ChatRoute) =>
        createRoute({
          base: base.chat({ projectId, assistantId }),
        }),
      artifactBuilder: ({
        artifactId,
        threadId,
        clone,
        params,
      }: ArtifactBuilderRoute = {}) =>
        createRoute({
          base: base.artifactBuilder({
            projectId,
            artifactId,
            threadId,
            clone,
          }),
          params,
        }),
      assistantBuilder: ({
        assistantId,
        threadId,
        params,
      }: AssistantBuilderRoute = {}) =>
        createRoute({
          base: base.assistantBuilder({ projectId, assistantId, threadId }),
          params,
        }),
    }),
    [projectId],
  );

  const navigate = (route: string, params?: { replace?: boolean }) => {
    if (params?.replace) {
      router.replace(route);
    } else {
      router.push(route);
    }
  };

  return { routes, navigate };
}
