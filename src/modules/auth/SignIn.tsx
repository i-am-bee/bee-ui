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
import { Realm } from '@/app/auth/signin/actions';
import { useTheme } from '@/layout/providers/ThemeProvider';
import { Button, InlineNotification, Loading } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import { useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import classes from './SignIn.module.scss';
import { VersionTag } from '@/components/VersionTag/VersionTag';

interface Props {
  error: LoginError | null;
  action: (realm: Realm) => void;
}

const VIDEO_REPLAY_INTERVAL = 10 * 1000;

export function SignIn({ error, action }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { appliedTheme } = useTheme();

  useEffect(() => {
    const videoElement = videoRef.current;

    const replayVideoAfterDelay = () => {
      timeoutRef.current = setTimeout(() => {
        if (videoElement) {
          videoElement.play();
        }
      }, VIDEO_REPLAY_INTERVAL);
    };

    const handleVideoEnded = () => {
      replayVideoAfterDelay();
    };

    if (videoElement) {
      videoElement.addEventListener('ended', handleVideoEnded);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('ended', handleVideoEnded);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && appliedTheme) {
      // detect the webm support
      const videoConfiguration = {
        type: 'file' as const,
        video: {
          contentType: 'video/webm;codecs=vp9',
          width: 4400,
          height: 4000,
          bitrate: 790,
          framerate: 25,
        },
      };

      navigator.mediaCapabilities
        .decodingInfo(videoConfiguration)
        .then((result) => {
          const ext = result.supported ? 'webm' : 'mov';
          const version = appliedTheme === 'dark' ? 'dark' : 'light';
          const videoSource = `/video/login-bee-animation-${version}.${ext}`;
          videoElement.pause();
          videoElement.setAttribute('src', videoSource);
          videoElement.load();
        });

      const playVideo = () => {
        videoElement.play();
      };

      videoElement.addEventListener('loadeddata', playVideo);

      return () => {
        videoElement.removeEventListener('loadeddata', playVideo);
      };
    }
  }, [appliedTheme]);

  return (
    <div className={classes.root}>
      <div className={classes.loginGrid}>
        <div className={classes.content}>
          {error != null && (
            <InlineNotification
              kind={error.kind}
              statusIconDescription={error.kind}
              title={error.title}
            />
          )}

          <h1 className={classes.heading}>
            IBM {APP_NAME}
            <VersionTag />
          </h1>

          <form className={classes.form} action={() => action('ent.ibm.com')}>
            <p className={classes.label}>Log in with IBMid</p>

            <LoginButton label="IBMid" />
          </form>

          <form
            className={classes.form}
            action={() => action('www.google.com')}
          >
            <p className={classes.label}>Log in with Google</p>

            <LoginButton label="Google" />
          </form>
        </div>

        <div className={classes.video}>
          <div className={classes.videoHolder}>
            <video
              ref={videoRef}
              width={800}
              height={800}
              playsInline
              autoPlay
              muted
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return pending ? (
    <div className={classes.loading}>
      <Loading small withOverlay={false} />
      Redirecting to {label}
    </div>
  ) : (
    <Button size="lg" kind="secondary" renderIcon={ArrowRight} type="submit">
      {label}
    </Button>
  );
}

export interface LoginError {
  kind: 'warning' | 'error';
  title: string;
}

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME!;
