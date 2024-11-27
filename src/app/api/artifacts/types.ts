import { paths } from '../schema';

export type ListArtifactsResponse =
  paths['/v1/artifacts']['get']['responses']['200']['content']['application/json'];

export type ArtifactResult =
  paths['/v1/artifacts/{artifact_id}']['get']['responses']['200']['content']['application/json'];

export type ArtifactCreateBody = NonNullable<
  paths['/v1/artifacts']['post']['requestBody']
>['content']['application/json'];

export type ArtifactsListQuery = NonNullable<
  paths['/v1/artifacts']['get']['parameters']['query']
>;
