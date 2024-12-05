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
import { Theme, useTheme } from '@/layout/providers/ThemeProvider';
import { USERCONTENT_SITE_URL } from '@/utils/constants';
import { removeTrailingSlash } from '@/utils/helpers';
import { Loading } from '@carbon/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppBuilder } from './AppBuilderProvider';
import classes from './ArtifactSharedIframe.module.scss';

interface Props {
  sourceCode: string;
}

export function ArtifactSharedIframe({ sourceCode }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<State>(State.LOADING);
  const { appliedTheme: theme } = useTheme();

  const postMessage = (message: PostMessage) => {
    iframeRef.current?.contentWindow?.postMessage(
      message,
      USERCONTENT_SITE_URL,
    );
  };

  const updateTheme = useCallback((theme: Theme) => {
    postMessage({ type: PostMessageType.UPDATE_THEME, theme });
  }, []);

  const updateCode = useCallback((code: string | null) => {
    if (!code) {
      return;
    }

    postMessage({ type: PostMessageType.UPDATE_CODE, code });
  }, []);

  const handleMessage = useCallback((event: MessageEvent<StliteMessage>) => {
    const { origin, data } = event;

    if (origin !== removeTrailingSlash(USERCONTENT_SITE_URL)) {
      return;
    }

    if (
      data.type === SCRIPT_RUN_STATE_CHANGED &&
      data.scriptRunState === ScriptRunState.RUNNING
    ) {
      setState(State.READY);
    }
  }, []);

  const handleIframeLoad = useCallback(() => {
    if (theme) {
      updateTheme(theme);
    }
  }, [theme, updateTheme]);

  useEffect(() => {
    if (theme) {
      updateTheme(theme);
    }
  }, [theme, updateTheme]);

  useEffect(() => {
    if (state === State.READY) {
      updateCode(sourceCode);
    }
  }, [state, theme, sourceCode, updateCode]);

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  return (
    <div className={classes.root}>
      <iframe
        ref={iframeRef}
        src={USERCONTENT_SITE_URL}
        title="Bee App preview"
        sandbox="allow-scripts allow-downloads allow-same-origin"
        className={classes.app}
        onLoad={handleIframeLoad}
      />

      {state === State.LOADING && sourceCode && <Loading />}
    </div>
  );
}

type PostMessage =
  | {
      type: PostMessageType.UPDATE_CODE;
      code: string;
    }
  | {
      type: PostMessageType.UPDATE_THEME;
      theme: Theme;
    };

enum PostMessageType {
  UPDATE_CODE = 'updateCode',
  UPDATE_THEME = 'updateTheme',
  // TODO: Add error handling
  ERROR = 'error',
}

enum ScriptRunState {
  INITIAL = 'initial',
  NOT_RUNNING = 'notRunning',
  RUNNING = 'running',
}

enum State {
  LOADING = 'loading',
  READY = 'ready',
}

const SCRIPT_RUN_STATE_CHANGED = 'SCRIPT_RUN_STATE_CHANGED';

interface StliteMessage {
  type: typeof SCRIPT_RUN_STATE_CHANGED;
  scriptRunState: ScriptRunState;
}
