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

import { Modal } from '@/components/Modal/Modal';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { ModalBody, ModalFooter } from '@carbon/react';
import clsx from 'clsx';
import { useState } from 'react';
import { Assistant } from '../assistants/types';
import classes from './OnboardingModal.module.scss';
import { OnboardingAssistantSelection } from './OnboardingAssistantSelection';
import { OnboardingIntro } from './OnboardingIntro';

interface Props extends ModalProps {
  assistants?: Assistant[];
}

export function OnboardingModal({ assistants, ...props }: Props) {
  const [step, setStep] = useState(Steps.ASSISTANT_SELECTION);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(
    null,
  );

  let content;

  switch (step) {
    case Steps.INTRO:
      content = {
        body: <OnboardingIntro />,
        footer: (
          <OnboardingIntro.Footer
            onNextClick={() => setStep(Steps.ASSISTANT_SELECTION)}
          />
        ),
      };
      break;
    case Steps.ASSISTANT_SELECTION:
      content = {
        body: (
          <OnboardingAssistantSelection
            assistants={assistants}
            selected={selectedAssistant}
            onSelect={setSelectedAssistant}
          />
        ),
        footer: (
          <OnboardingAssistantSelection.Footer
            onBackClick={() => setStep(Steps.INTRO)}
            onNextClick={() => {
              console.log(selectedAssistant);
            }}
          />
        ),
      };
      break;
  }

  const { body, footer } = content;

  return (
    <Modal
      {...props}
      preventCloseOnClickOutside
      className={clsx(classes.root, classes[`step--${step}`])}
    >
      <ModalBody>{body}</ModalBody>

      <ModalFooter>{footer}</ModalFooter>
    </Modal>
  );
}

enum Steps {
  INTRO = 'intro',
  ASSISTANT_SELECTION = 'assistant-selection',
}
