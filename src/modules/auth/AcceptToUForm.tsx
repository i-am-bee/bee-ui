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
import { useToast } from '@/layout/providers/ToastProvider';
import { Button, Checkbox, InlineLoading } from '@carbon/react';
import { ArrowRight } from '@carbon/react/icons';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import {
  MouseEventHandler,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { acceptTou } from '../../app/auth/accept-tou/actions';
import classes from './AcceptToUForm.module.scss';
import toUAnimation from './ToUAnimation.json';

interface Props {
  content: ReactNode;
  callbackUrl: string;
}

export function AcceptToUForm({ content, callbackUrl }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shouldPauseAnimation, setShouldPauseAnimation] = useState(true);
  const [response, formAction] = useFormState(acceptTou.bind(null), null);

  const { addToast } = useToast();

  const onEnterFrame = (event: any) => {
    const { currentTime } = event as EnterFrameEvent;
    const lottie = lottieRef.current;

    if (!lottie) {
      return;
    }

    if (shouldPauseAnimation && currentTime > ANIMATION_PAUSE_FRAME) {
      setShouldPauseAnimation(false);
      lottie.pause();
    }
  };

  const onComplete = () => {
    formRef.current?.requestSubmit();
  };

  const onButtonClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    const lottie = lottieRef.current;

    setShouldPauseAnimation(false);

    if (lottie) {
      lottie.play();

      setLoading(true);

      event.preventDefault();
    }
  };

  const checkScrolled = useCallback(() => {
    const element = scrollRef.current;

    if (!element || scrolled) {
      return;
    }

    const { scrollHeight, clientHeight, scrollTop } = element;

    if (scrollHeight - clientHeight - scrollTop <= SCROLLED_BOTTOM_THRESHOLD) {
      setScrolled(true);
    }
  }, [scrolled]);

  useEffect(() => {
    checkScrolled();
  }, [checkScrolled]);

  useEffect(() => {
    if (response?.success) {
      // CSS styles don't get loaded correctly when redirecting
      // to the (main) layout with next/navigation, I couldn't
      // find a better solution than using native browser redirect.
      window.location.replace(callbackUrl);
    }
    if (response?.error) {
      addToast({
        title: 'Accepting Terms of Use failed',
        subtitle: response.message,
        timeout: 10000,
      });
    }
  }, [response, addToast, callbackUrl]);

  return (
    <>
      <form className={classes.root} action={formAction} ref={formRef}>
        <h1 className={classes.heading}>Terms of Use</h1>

        <div
          ref={scrollRef}
          className={classes.content}
          onScroll={checkScrolled}
        >
          {content}
        </div>

        <Checkbox
          className={classes.checkbox}
          labelText="I accept the terms of use"
          id="accept"
          name="accept"
          required
          value="yes"
          checked={accepted}
          onChange={(_, { checked }) => {
            setAccepted(checked);
          }}
          disabled={!scrolled}
        />

        <SubmitButton
          disabled={!accepted}
          isRedirecting={Boolean(response?.success) || loading}
          onClick={onButtonClick}
        />
      </form>

      <Lottie
        lottieRef={lottieRef}
        className={classes.animation}
        animationData={toUAnimation}
        loop={false}
        onEnterFrame={onEnterFrame}
        onComplete={onComplete}
      />
    </>
  );
}

function SubmitButton({
  disabled,
  isRedirecting,
  onClick,
}: {
  disabled?: boolean;
  isRedirecting: boolean;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  const { pending } = useFormStatus();
  const isPending = pending || isRedirecting;

  return (
    <Button
      className={classes.button}
      type="submit"
      kind="secondary"
      renderIcon={ArrowRight}
      disabled={disabled || isPending}
      onClick={onClick}
    >
      {isPending ? <InlineLoading description="Starting..." /> : 'Get started'}
    </Button>
  );
}

interface EnterFrameEvent {
  currentTime: number;
  direction: number;
  totalTime: number;
  type: 'enterFrame';
}

const ANIMATION_PAUSE_FRAME = 165;
const SCROLLED_BOTTOM_THRESHOLD = 5;
