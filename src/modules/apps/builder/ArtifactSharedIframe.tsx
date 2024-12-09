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
import classes from './ArtifactSharedIframe.module.scss';
import { createChatCompletion, modulesToPackages } from '../../../app/api/apps';
import { ChatCompletionCreateBody } from '@/app/api/apps/types';

interface Props {
  sourceCode: string | null;
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

  const handleMessage = useCallback(
    async (event: MessageEvent<StliteMessage>) => {
      const { origin, data } = event;

      if (origin !== removeTrailingSlash(USERCONTENT_SITE_URL)) {
        return;
      }

      if (
        data.type === RecieveMessageType.SCRIPT_RUN_STATE_CHANGED &&
        data.scriptRunState === ScriptRunState.RUNNING
      ) {
        setState(State.READY);
      }
      if (data.type === RecieveMessageType.REQUEST) {
        switch (data.request_type) {
          case 'modules_to_packages':
            const packagesResponse = await modulesToPackages(
              data.payload.modules,
            );
            postMessage({
              type: PostMessageType.RESPONSE,
              request_id: data.request_id,
              payload: packagesResponse,
            });
            break;
          case 'chat_completion':
            const response = await createChatCompletion({ ...data.payload });
            const message = response?.choices[0]?.message?.content;
            postMessage({
              type: PostMessageType.RESPONSE,
              request_id: data.request_id,
              payload: message
                ? { message }
                : { error: 'Unknown error occurred.' },
            });
            break;
          default:
            //Todo
            break;
        }
      }

      console.log(data);
    },
    [],
  );

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
    }
  | {
      type: PostMessageType.RESPONSE;
      request_id: string;
      payload: unknown;
    };

enum PostMessageType {
  UPDATE_CODE = 'bee:updateCode',
  UPDATE_THEME = 'bee:updateTheme',
  RESPONSE = 'bee:response',
  // TODO: Add error handling
  ERROR = 'bee:error',
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

enum RecieveMessageType {
  SCRIPT_RUN_STATE_CHANGED = 'SCRIPT_RUN_STATE_CHANGED',
  REQUEST = 'bee:request',
}

export type StliteMessage =
  | {
      type: RecieveMessageType.SCRIPT_RUN_STATE_CHANGED;
      scriptRunState: ScriptRunState;
    }
  | {
      type: RecieveMessageType.REQUEST;
      request_type: 'modules_to_packages';
      request_id: string;
      payload: { modules: string[] };
    }
  | {
      type: RecieveMessageType.REQUEST;
      request_type: 'chat_completion';
      request_id: string;
      payload: ChatCompletionCreateBody;
    };
