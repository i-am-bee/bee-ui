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
import { createChatCompletion, modulesToPackages } from '@/app/api/apps';
import { ChatCompletionCreateBody } from '@/app/api/apps/types';
import { ApiError } from '@/app/api/errors';
import { Project } from '@/app/api/projects/types';
import { Organization } from '@/app/api/organization/types';

interface Props {
  sourceCode: string | null;
  projectId: string;
  organizationId: string;
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

export function ArtifactSharedIframe({
  sourceCode,
  projectId,
  organizationId,
}: Props) {
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
        try {
          switch (data.request_type) {
            case 'modules_to_packages':
              const packagesResponse = await modulesToPackages(
                organizationId,
                projectId,
                data.payload.modules,
              );
              postMessage({
                type: PostMessageType.RESPONSE,
                request_id: data.request_id,
                payload: packagesResponse,
              });
              break;
            case 'chat_completion':
              const response = await createChatCompletion(
                organizationId,
                projectId,
                data.payload,
              );
              const message = response?.choices[0]?.message?.content;
              if (!message) throw new Error(); // missing completion
              postMessage({
                type: PostMessageType.RESPONSE,
                request_id: data.request_id,
                payload: { message },
              });
              break;
          }
        } catch (err) {
          postMessage({
            type: PostMessageType.RESPONSE,
            request_id: data.request_id,
            payload: { error: getErrorMessage(err) },
          });
        }
      }
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
