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
import { AssistantBaseIcon } from '@/modules/assistants/icons/AssistantBaseIcon';
import { memo, useRef } from 'react';
import { useChat } from '../providers/ChatProvider';
import classes from './Disclaimer.module.scss';
import { Container } from '@/components/Container/Container';

export const Disclaimer = memo(function Disclaimer() {
  const { assistant, disabledTools, builderState, threadSettingsButtonRef } =
    useChat();

  const toolsInUse = assistant.data?.tools?.length !== disabledTools.length;

  const externalToolsTitle = 'External tools in use.';

  return (
    <div className={classes.root}>
      <Container size="sm" className={classes.disclaimer}>
        <p>
          Bee is an experimental AI that can fly off course. Double check all
          important information.
        </p>
        {toolsInUse && (
          <p>
            {builderState ? (
              externalToolsTitle
            ) : (
              <button
                className={classes.toolsButton}
                type="button"
                onClick={() => threadSettingsButtonRef.current?.click()}
              >
                {externalToolsTitle}
              </button>
            )}
          </p>
        )}
      </Container>
    </div>
  );
});
