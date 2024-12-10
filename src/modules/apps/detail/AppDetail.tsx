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

import { ArtifactSharedIframe } from '../builder/ArtifactSharedIframe';
import { Artifact } from '../types';
import classes from './AppDetail.module.scss';

interface Props {
  artifact: Artifact;
  projectId: string;
  organizationId: string;
}
export function AppDetail({ artifact, projectId, organizationId }: Props) {
  return (
    <div className={classes.root}>
      <ArtifactSharedIframe
        sourceCode={artifact.source_code || null}
        projectId={projectId}
        organizationId={organizationId}
      />
    </div>
  );
}
