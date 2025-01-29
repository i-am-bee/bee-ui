import { concatRouteSegments, createRoute } from './helpers';
import {
  ArtifactBase,
  ArtifactBuilderBase,
  ArtifactCloneRoute,
  ArtifactsRoute,
  AssistantBase,
  AssistantBuilderBase,
  ProjectBase,
  ProjectRoute,
  SignInRoute,
  ThreadBase,
  UnauthorizedRoute,
  VectorStoreBase,
} from './types';

export const definitions = {
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
      base: definitions.home(),
    }),
  termsOfUse: () =>
    createRoute({
      base: definitions.termsOfUse(),
    }),
  signIn: ({ params }: SignInRoute = {}) =>
    createRoute({
      base: definitions.signIn(),
      params,
    }),
  unauthorized: ({ params }: UnauthorizedRoute = {}) =>
    createRoute({
      base: definitions.unauthorized(),
      params,
    }),
  project: ({ projectId, params }: ProjectRoute) =>
    createRoute({
      base: definitions.project({ projectId }),
      params,
    }),
  artifacts: ({ projectId }: ArtifactsRoute) =>
    createRoute({
      base: definitions.artifacts({ projectId }),
    }),
  artifactClone: ({ projectId, artifactId, params }: ArtifactCloneRoute) =>
    createRoute({
      base: definitions.artifactClone({ projectId, artifactId }),
      params,
    }),
};
