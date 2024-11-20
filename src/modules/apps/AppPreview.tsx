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
import { useEffect, useRef } from 'react';
import classes from './AppBuilder.module.scss';
import { useAppBuilder } from './AppBuilderProvider';

interface Props {}

export function AppPreview({}: Props) {
  const { sourceCode } = useAppBuilder();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    iframeRef?.current?.contentWindow?.postMessage?.(
      {
        type: MESSAGE_TYPE_UPDATE_CODE,
        code: sourceCode,
      },
      '*', // TODO: set origin for production
    );
  }, [sourceCode]);

  return (
    <iframe
      src=""
      ref={iframeRef}
      title="Bee App preview"
      className={classes.app}
      sandbox="allow-scripts allow-downloads"
    />
  );
}

const MESSAGE_TYPE_UPDATE_CODE = 'updateCode';
const MESSAGE_TYPE_ERROR = 'error';
