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
import { useAppContext } from '@/layout/providers/AppProvider';
import { ModalControlProvider } from '@/layout/providers/ModalControlProvider';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { ONBOARDING_PARAM } from '@/utils/constants';
import { noop } from '@/utils/helpers';
import { ModalBody, ModalFooter } from '@carbon/react';
import clsx from 'clsx';
import { useRouter } from 'next-nprogress-bar';
import { useState } from 'react';
import { ASSISTANT_TEMPLATES } from '../assistants/templates';
import { AssistantTemplate } from '../assistants/types';
import { OnboardingAssistantSelection } from './OnboardingAssistantSelection';
import { OnboardingIntro } from './OnboardingIntro';
import classes from './OnboardingModal.module.scss';

interface Props extends ModalProps {}

export function OnboardingModal({ ...props }: Props) {
  const router = useRouter();
  const { project } = useAppContext();
  const [step, setStep] = useState(Steps.INTRO);
  const [selectedTemplate, setSelectedTemplate] =
    useState<AssistantTemplate | null>(null);

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
            templates={ASSISTANT_TEMPLATES}
            selected={selectedTemplate}
            onSelect={setSelectedTemplate}
          />
        ),
        footer: (
          <OnboardingAssistantSelection.Footer
            onBackClick={() => setStep(Steps.INTRO)}
            onNextClick={() => {
              router.push(
                `/${project.id}/builder?${ONBOARDING_PARAM}${selectedTemplate ? `&template=${selectedTemplate.key}` : ''}`,
              );
            }}
          />
        ),
      };
      break;
  }

  const { body, footer } = content;

  return (
    <ModalControlProvider onRequestClose={noop}>
      <Modal
        {...props}
        preventCloseOnClickOutside
        className={clsx(classes.root, classes[`step--${step}`])}
      >
        <ModalBody>{body}</ModalBody>

        <ModalFooter>{footer}</ModalFooter>
      </Modal>
    </ModalControlProvider>
  );
}

enum Steps {
  INTRO = 'intro',
  ASSISTANT_SELECTION = 'assistant-selection',
}
