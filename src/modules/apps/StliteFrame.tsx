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
import { useCallback, useEffect, useRef, useState } from 'react';
import classes from './StliteFrame.module.scss';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import { Loading } from '@carbon/react';
import { STLITE_SITE_URL } from '@/utils/constants';

interface Props {}

export function StliteFrame({}: Props) {
  const { code } = useAppBuilder();
  const { getCode } = useAppBuilderApi();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<StliteState>('loading');

  const triggerCodeUpdate = useCallback((code: string | null) => {
    iframeRef?.current?.contentWindow?.postMessage?.(
      {
        type: MESSAGE_TYPE_UPDATE_CODE,
        code,
      },
      '*', // TODO: set origin for production
    );
  }, []);

  useEffect(() => triggerCodeUpdate(code), [code, triggerCodeUpdate]);

  useEffect(() => {
    if (state === 'ready') {
      const code = getCode();
      if (code) triggerCodeUpdate(getCode());
    }
  }, [getCode, state, triggerCodeUpdate]);

  useEffect(() => {
    const handleStliteMessage = (e: MessageEvent<StliteMessage>) => {
      if (e.data.type === STLITE_MESSAGE_TYPE_STATE_CHANGED) {
        if (e.data.scriptRunState === 'running') setState('ready');
      }
    };

    window.removeEventListener('message', handleStliteMessage);
    window.addEventListener('message', handleStliteMessage);

    return () => {
      window.removeEventListener('message', handleStliteMessage);
    };
  }, []);

  return (
    <div className={classes.root}>
      <iframe
        src={STLITE_SITE_URL}
        ref={iframeRef}
        title="Bee App preview"
        className={classes.app}
        sandbox="allow-scripts allow-downloads allow-same-origin"
      />
      {state === 'loading' && code && <Loading />}
    </div>
  );
}

const MESSAGE_TYPE_UPDATE_CODE = 'updateCode';
const MESSAGE_TYPE_ERROR = 'error';

const STLITE_MESSAGE_TYPE_STATE_CHANGED = 'SCRIPT_RUN_STATE_CHANGED';

type StliteState = 'loading' | 'ready';
interface StliteMessage {
  type: typeof STLITE_MESSAGE_TYPE_STATE_CHANGED;
  scriptRunState: 'notRunning' | 'running' | 'initial';
}
