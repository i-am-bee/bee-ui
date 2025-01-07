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
import { createChatCompletion, modulesToPackages } from '@/app/api/apps';
import { ChatCompletionCreateBody } from '@/app/api/apps/types';
import { ApiError } from '@/app/api/errors';
import { useProjectContext } from '@/layout/providers/ProjectProvider';
import { Theme, useTheme } from '@/layout/providers/ThemeProvider';
import { USERCONTENT_SITE_URL } from '@/utils/constants';
import { removeTrailingSlash } from '@/utils/helpers';
import { Loading } from '@carbon/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import classes from './ArtifactSharedIframe.module.scss';
import AppPlaceholder from './Placeholder.svg';

interface Props {
  sourceCode: string | null;
  onFixError?: (errorText: string) => void;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.code === 'too_many_requests') {
    return 'You have exceeded the limit for using LLM functions';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unknown error when calling LLM function.';
}

export function ArtifactSharedIframe({ sourceCode, onFixError }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<State>(State.LOADING);
  const { appliedTheme: theme } = useTheme();
  const { project, organization } = useProjectContext();

  const postMessage = (message: PostMessage) => {
    // Avoid sending message to wrong origin
    // No security error = cross origin iframe not loaded yet
    try { iframeRef.current?.contentWindow?.document; return; } catch { }

    iframeRef.current?.contentWindow?.postMessage(
      message,
      USERCONTENT_SITE_URL,
    );
  };

  const [appState, setAppState] = useState<AppState>({
    code: sourceCode ?? 'async def main():\n  pass',
    config: {
      canFixError: Boolean(onFixError)
    },
    theme: theme ?? 'system',
    fullscreen: false,
    ancestorOrigin: window.location.origin,
  });
  const handleIframeLoad = useCallback(() => { theme && setAppState(state => ({ ...state, theme })) }, [theme]);
  useEffect(() => { theme && setAppState(state => ({ ...state, theme })) }, [theme]);
  useEffect(() => { sourceCode && setAppState(state => ({ ...state, code: sourceCode })) }, [sourceCode]);
  useEffect(() => { postMessage({ type: PostMessageType.UPDATE_STATE, stateChange: appState }) }, [appState, state]);

  const handleMessage = useCallback(
    async (event: MessageEvent<StliteMessage>) => {
      const { origin, data } = event;

      if (origin !== removeTrailingSlash(USERCONTENT_SITE_URL)) {
        return;
      }

      if (data.type === RecieveMessageType.READY) {
        setState(State.READY);
        return;
      }

      if (data.type === RecieveMessageType.REQUEST) {
        const respond = (payload: unknown = undefined) =>
          postMessage({
            type: PostMessageType.RESPONSE,
            request_id: data.request_id,
            payload,
          });

        try {
          switch (data.request_type) {
            case 'modules_to_packages':
              const packagesResponse = await modulesToPackages(
                organization.id,
                project.id,
                data.payload.modules,
              );
              respond(packagesResponse);
              break;

            case 'chat_completion':
              const response = await createChatCompletion(
                organization.id,
                project.id,
                data.payload,
              );
              const message = response?.choices[0]?.message?.content;
              if (!message) throw new Error(); // missing completion
              respond({ message });
              break;

            case 'fix_error':
              onFixError?.(data.payload.errorText);
              respond();
              break;
          }
        } catch (err) {
          respond({ error: getErrorMessage(err) });
        }
        return;
      }
    },
    [project, organization, onFixError],
  );

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
        title="App preview"
        sandbox={[
          'allow-scripts',
          'allow-downloads',
          'allow-same-origin',
          'allow-popups',
          'allow-popups-to-escape-sandbox',
        ].join(' ')}
        className={classes.app}
        onLoad={handleIframeLoad}
      />

      {!sourceCode ? (
        <div className={classes.placeholder}>
          <AppPlaceholder />
        </div>
      ) : (
        state === State.LOADING && <Loading />
      )}
    </div>
  );
}

interface AppState {
  fullscreen: boolean,
  theme: 'light' | 'dark' | 'system',
  code: string,
  config: {
    canFixError: boolean
  },
  ancestorOrigin: string,
}

type PostMessage =
  | {
      type: PostMessageType.UPDATE_STATE;
      stateChange: Partial<AppState>;
    }
  | {
      type: PostMessageType.RESPONSE;
      request_id: string;
      payload: unknown;
    };

enum PostMessageType {
  RESPONSE = 'bee:response',
  UPDATE_STATE = 'bee:updateState'
}

enum State {
  LOADING = 'loading',
  READY = 'ready',
}

enum RecieveMessageType {
  READY = 'bee:ready',
  REQUEST = 'bee:request',
}

export type StliteMessage =
  | {
      type: RecieveMessageType.READY;
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
    }
  | {
      type: RecieveMessageType.REQUEST;
      request_type: 'fix_error';
      request_id: string;
      payload: { errorText: string };
    };
