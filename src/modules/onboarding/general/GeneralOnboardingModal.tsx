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
import { useFirstAssistant } from '@/modules/assistants/api/queries/useFirstAssistant';
import { isNotNull, noop } from '@/utils/helpers';
import { ModalBody, ModalHeader } from '@carbon/react';
import shuffle from 'lodash/shuffle';
import { useRouter } from 'next-nprogress-bar';
import classes from './GeneralOnboardingModal.module.scss';
import { OnboardingCard } from './OnboardingCard';
import OnboardingAgent from './onboarding-agent.svg';
import OnboardingApp from './onboarding-app.svg';
import OnboardingChat from './onboarding-chat.svg';

export function GeneralOnboardingModal({ ...props }: ModalProps) {
  const router = useRouter();
  const { project } = useAppContext();
  const firstAssistant = useFirstAssistant();

  const CARDS = shuffle([
    firstAssistant
      ? {
          heading: 'Chat with Agent Bee',
          description:
            'Chat with our general purpose agent, perform internet searches and work with documents.',
          image: <OnboardingChat />,
          onClick: () => {
            router.push(`/${project.id}/chat/${firstAssistant.id}`);
          },
        }
      : undefined,
    {
      heading: 'Create an Agent',
      description:
        'Create a new agent by writing its role, connecting tools, and giving it access to documents.',
      image: <OnboardingAgent />,
      onClick: () => {
        router.push(`/${project.id}/builder`);
      },
    },
    {
      heading: 'Build an App',
      description:
        'Chat to build reusable automations like transcript summarizers and dashboards',
      image: <OnboardingApp />,
      onClick: () => {
        router.push(`/${project.id}/apps/builder`);
      },
    },
  ]).filter(isNotNull);

  return (
    <ModalControlProvider onRequestClose={noop}>
      <Modal {...props} className={classes.root}>
        <ModalHeader title="Welcome to BeeAI! Where would you like to start?" />
        <ModalBody>
          <p className={classes.description}>
            BeeAI is a platform for building and using LLM-powered custom agents
            and apps to improve productivity.
          </p>

          <ul className={classes.list}>
            {CARDS.map((props, idx) => (
              <li key={idx}>
                <OnboardingCard {...props} />
              </li>
            ))}
          </ul>
        </ModalBody>
      </Modal>
    </ModalControlProvider>
  );
}
