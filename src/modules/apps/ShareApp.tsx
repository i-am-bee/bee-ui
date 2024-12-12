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

import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { decodeEntityWithMetadata } from '@/app/api/utils';
import { ARTIFACTS_SITE_URL } from '@/utils/constants';
import { removeTrailingSlash } from '@/utils/helpers';
import {
  CopyButton,
  InlineLoading,
  InlineNotification,
  TextInput,
  Toggle,
} from '@carbon/react';
import { ContentDeliveryNetwork } from '@carbon/react/icons';
import { useId, useState } from 'react';
import { useSaveArtifact } from './hooks/useSaveArtifact';
import classes from './ShareApp.module.scss';
import { Artifact } from './types';

interface Props {
  artifact: Artifact;
  project: Project;
  organization: Organization;
  onSuccess?: (artifact: Artifact) => void;
}

export function ShareApp({
  artifact,
  project,
  organization,
  onSuccess,
}: Props) {
  const id = useId();
  const [shareUrl, setShareUrl] = useState(artifact.share_url);
  const fullShareUrl = createFullShareUrl({
    artifactId: artifact.id,
    shareUrl,
  });

  const {
    mutateAsync: mutateSave,
    isError,
    error,
    isPending,
  } = useSaveArtifact({
    onSuccess: (result) => {
      const artifact = decodeEntityWithMetadata<Artifact>(result);

      setShareUrl(artifact.share_url);
      onSuccess?.(artifact);
    },
  });

  return (
    <section className={classes.root}>
      <header className={classes.header}>
        <div className={classes.icon}>
          <ContentDeliveryNetwork />
        </div>

        <div className={classes.text}>
          <h3 className={classes.heading}>Public link</h3>
          <p className={classes.description}>
            Anyone with this link can remix or save this artifact
          </p>
        </div>

        {isPending ? (
          <InlineLoading />
        ) : (
          <Toggle
            id={`${id}:toggle`}
            size="sm"
            onToggle={(checked) =>
              mutateSave({
                id: artifact.id,
                body: {
                  shared: checked,
                },
              })
            }
            toggled={Boolean(shareUrl)}
            hideLabel
          />
        )}
      </header>

      {isError && (
        <InlineNotification
          kind="error"
          title={error.message}
          lowContrast
          hideCloseButton
        />
      )}

      {fullShareUrl && (
        <div className={classes.inputWrapper}>
          <TextInput
            id={`${id}:link`}
            labelText="Public link"
            value={fullShareUrl}
            size="lg"
            readOnly
            hideLabel
          />

          <CopyButton
            kind="ghost"
            size="lg"
            aria-label="Copy"
            onClick={() => {
              navigator.clipboard.writeText(fullShareUrl);
            }}
          />
        </div>
      )}
    </section>
  );
}

function extractToken(url: string) {
  const match = url.match(/shared[?&]token=([^&]+)/);

  return match ? decodeURIComponent(match[1]) : null;
}

function createFullShareUrl({
  artifactId,
  shareUrl,
}: {
  artifactId: string;
  shareUrl: string | null;
}) {
  return shareUrl
    ? `${removeTrailingSlash(ARTIFACTS_SITE_URL)}/artifacts/${artifactId}?token=${extractToken(shareUrl)}`
    : null;
}
