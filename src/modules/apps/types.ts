import { EntityWithDecodedMetadata } from '@/app/api/types';
import { AppIconName } from './AppIcon';
import { ArtifactResult } from '@/app/api/artifacts/types';

export interface ArtifactMetadata {
  icon?: AppIconName;
}

export type Artifact = EntityWithDecodedMetadata<
  ArtifactResult,
  ArtifactMetadata
>;
