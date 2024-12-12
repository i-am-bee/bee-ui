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

import { Container } from '@/components/Container/Container';
import { useAppContext } from '@/layout/providers/AppProvider';
import { NewSessionButton } from '@/layout/shell/NewSessionButton';
import classes from './ConversationHeader.module.scss';
import { useChat } from './providers/ChatProvider';

export function ConversationHeader() {
  const { assistant: appAssistant } = useAppContext();
  const { assistant: threadAssistant } = useChat();

  const assistant = threadAssistant.data ?? appAssistant;

  return (
    <div className={classes.root}>
      <div className={classes.holder}>
        <Container size="sm">
          <div className={classes.content}>
            <NewSessionButton />
          </div>
        </Container>
      </div>
    </div>
  );
}
