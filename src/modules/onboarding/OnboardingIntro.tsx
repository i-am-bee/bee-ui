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

import { DOCUMENTATION_URL } from '@/utils/constants';
import { Button } from '@carbon/react';
import { ArrowRight, Launch } from '@carbon/react/icons';
import Illustration from './illustration.svg';
import classes from './OnboardingIntro.module.scss';

export function OnboardingIntro() {
  return (
    <div>
      <div className={classes.illustration}>
        <video src="/video/agents.mp4" playsInline autoPlay muted />
      </div>

      <h2 className={classes.heading}>Agents</h2>

      <div className={classes.content}>
        <p>
          Create an AI agent to accelerate your work. Give it a role, equip it
          with knowledge and tools, and let it streamline your tasks
          effortlessly
        </p>
      </div>
    </div>
  );
}

OnboardingIntro.Footer = function OnboardingIntroFooter({
  onNextClick,
}: {
  onNextClick: () => void;
}) {
  return (
    <>
      {DOCUMENTATION_URL && (
        <Button
          kind="tertiary"
          renderIcon={Launch}
          href={DOCUMENTATION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Resources
        </Button>
      )}

      <Button kind="secondary" renderIcon={ArrowRight} onClick={onNextClick}>
        Next
      </Button>
    </>
  );
};
