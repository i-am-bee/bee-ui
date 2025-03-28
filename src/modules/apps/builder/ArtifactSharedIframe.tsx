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
import { useAppContext } from '@/layout/providers/AppProvider';
import { useTheme } from '@/layout/providers/ThemeProvider';
import { USERCONTENT_SITE_URL } from '@/utils/constants';
import { removeTrailingSlash } from '@/utils/helpers';
import { Loading } from '@carbon/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import classes from './ArtifactSharedIframe.module.scss';
import AppPlaceholder from './Placeholder.svg';
import clsx from 'clsx';

interface Props {
  variant: 'detail' | 'builder';
  sourceCode: string | null;
  isPending?: boolean;
  onFixError?: (errorText: string) => void;
}

export function ArtifactSharedIframe({
  sourceCode,
  isPending,
  variant,
  onFixError,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<State>(State.LOADING);
  const appliedCodeRef = useRef<string | null>(null);
  const { appliedTheme: theme } = useTheme();
  const { project, organization } = useAppContext();
  const [iframeLoadCount, setIframeLoadCount] = useState<number>(0);

  const postMessage = useCallback(
    (message: PostMessage) => {
      if (iframeLoadCount === 0) return;
      iframeRef.current?.contentWindow?.postMessage(
        message,
        USERCONTENT_SITE_URL,
      );
    },
    [iframeLoadCount],
  );

  useEffect(() => {
    if (isPending) return;

    appliedCodeRef.current = sourceCode;

    postMessage({
      type: PostMessageType.UPDATE_STATE,
      stateChange: {
        code: sourceCode ?? undefined,
        config: {
          canFixError: Boolean(onFixError),
        },
        theme: theme ?? 'system',
        fullscreen: false,
        ancestorOrigin: window.location.origin,
      },
    });
  }, [sourceCode, onFixError, theme, postMessage, isPending]);

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
    [project, organization, onFixError, postMessage],
  );

  useEffect(() => {
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [handleMessage]);

  return (
    <div
      className={clsx(classes.root, {
        [classes[`variant-${variant}`]]: variant,
      })}
    >
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
        onLoad={() => setIframeLoadCount((i) => i + 1)}
      />

      {!sourceCode ? (
        <div className={classes.placeholder}>
          <AppPlaceholder />
        </div>
      ) : (
        (state === State.LOADING || isPending) && (
          <div
            className={clsx(classes.loading, {
              [classes.isAppReady]:
                appliedCodeRef.current && state === State.READY,
            })}
          >
            <Loading />
          </div>
        )
      )}
    </div>
  );
}

type PostMessage =
  | {
      type: PostMessageType.UPDATE_STATE;
      stateChange: Partial<{
        fullscreen: boolean;
        theme: 'light' | 'dark' | 'system';
        code: string;
        config: {
          canFixError: boolean;
        };
        ancestorOrigin: string;
      }>;
    }
  | {
      type: PostMessageType.RESPONSE;
      request_id: string;
      payload: unknown;
    };

enum PostMessageType {
  RESPONSE = 'bee:response',
  UPDATE_STATE = 'bee:updateState',
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

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.code === 'too_many_requests') {
    return 'You have exceeded the limit for using LLM functions';
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return 'Unknown error when calling LLM function.';
}
