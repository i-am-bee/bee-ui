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

import { AppIcon } from '@/modules/apps/AppIcon';
import {
  useAppBuilder,
  useAppBuilderApi,
} from '@/modules/apps/builder/AppBuilderProvider';
import {
  extractAppMetadataFromStreamlitCode,
  extractCodeFromMessageContent,
} from '@/modules/apps/utils';
import { InlineLoading } from '@carbon/react';
import { HTMLAttributes, useMemo } from 'react';
import { ExtraProps } from 'react-markdown';
import { useRunContext } from '../../providers/RunProvider';
import { MessageLoading } from '../MessageLoading';
import classes from './PythonAppCode.module.scss';

export function PythonAppCode({
  node,
  ...props
}: HTMLAttributes<HTMLElement> & ExtraProps) {
  const { message } = useRunContext();
  const { artifact } = useAppBuilder();
  const { setMobilePreviewOpen } = useAppBuilderApi();

  const appName = useMemo(() => {
    if (message?.pending || !message?.content) return null;

    return extractAppMetadataFromStreamlitCode(
      extractCodeFromMessageContent(message.content) ?? '',
    ).name;
  }, [message]);

  return (
    <div
      className={classes.root}
      onClick={() => {
        if (message?.pending || message?.error) {
          return;
        }

        setMobilePreviewOpen(true);
      }}
    >
      {message?.pending ? (
        <MessageLoading message="Loading the app" showSpinner />
      ) : message?.error ? (
        'There was an error loading the app'
      ) : (
        <div className={classes.app}>
          <span className={classes.icon}>
            {message?.pending ? (
              <InlineLoading />
            ) : (
              <AppIcon name={artifact ? artifact.uiMetadata.icon : 'Rocket'} />
            )}
          </span>
          {/* TODO: handle app error */}
          <strong>{appName ?? 'The app is ready'}</strong>
        </div>
      )}
    </div>
  );
}
