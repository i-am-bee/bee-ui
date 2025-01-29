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

import { CounterType } from '@/app/api/metrics/types';
import { Modal } from '@/components/Modal/Modal';
import { ModalControlProvider } from '@/layout/providers/ModalControlProvider';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { useFirstAssistant } from '@/modules/assistants/api/queries/useFirstAssistant';
import { useCaptureClickMetric } from '@/modules/metrics/api/mutations/useCaptureClickMetric';
import { useRoutes } from '@/routes/useRoutes';
import { isNotNull, noop } from '@/utils/helpers';
import { ModalBody, ModalHeader } from '@carbon/react';
import shuffle from 'lodash/shuffle';
import { useMemo } from 'react';
import classes from './GeneralOnboardingModal.module.scss';
import { OnboardingCard } from './OnboardingCard';
import OnboardingAgent from './onboarding-agent.svg';
import OnboardingApp from './onboarding-app.svg';
import OnboardingChat from './onboarding-chat.svg';

export function GeneralOnboardingModal({ ...props }: ModalProps) {
  const { routes, navigate } = useRoutes();
  const { assistant: firstAssistant, isPending } = useFirstAssistant();
  const { mutate: captureClickMetric } = useCaptureClickMetric();

  const cards = useMemo(
    () =>
      shuffle([
        firstAssistant
          ? {
              heading: 'Chat with Agent Bee',
              description:
                'Chat with our general purpose agent, perform internet searches and work with documents.',
              image: <OnboardingChat />,
              onClick: () => {
                captureClickMetric({ type: CounterType.CHAT_WITH_AGENT });
                navigate(routes.chat({ assistantId: firstAssistant.id }));
              },
            }
          : undefined,
        {
          heading: 'Create an Agent',
          description:
            'Create a new agent by writing its role, connecting tools, and giving it access to documents.',
          image: <OnboardingAgent />,
          onClick: () => {
            captureClickMetric({ type: CounterType.CREATE_AN_AGENT });
            navigate(routes.assistantBuilder());
          },
        },
        {
          heading: 'Build an App',
          description:
            'Chat to build reusable automations like transcript summarizers and dashboards',
          image: <OnboardingApp />,
          onClick: () => {
            captureClickMetric({ type: CounterType.BUILD_AN_APP });
            navigate(routes.artifactBuilder());
          },
        },
      ]).filter(isNotNull),
    [captureClickMetric, firstAssistant, routes, navigate],
  );

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
            {cards.map((props, idx) => (
              <li key={idx}>
                {isPending ? (
                  <OnboardingCard.Skeleton />
                ) : (
                  <OnboardingCard {...props} />
                )}
              </li>
            ))}
          </ul>
        </ModalBody>
      </Modal>
    </ModalControlProvider>
  );
}
