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

import { Tool } from '@/app/api/tools/types';
import { Modal } from '@/components/Modal/Modal';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { ModalBody, ModalHeader } from '@carbon/react';
import classes from './PublicToolModal.module.scss';
import { ToolDescription, ToolIcon } from '../ToolCard';
import { ToolExternalTag } from '@/modules/assistants/tools/ToolToggle';
import { isExternalTool } from '../utils';
import Markdown from 'react-markdown';

interface Props extends ModalProps {
  tool: Tool;
}

export function PublicToolModal({ tool, ...props }: Props) {
  return (
    <Modal {...props}>
      <ModalHeader />
      <ModalBody>
        <div className={classes.header}>
          <div>
            <ToolIcon tool={tool} />
          </div>
          <h2>{tool.name}</h2>
          <div>
            <ToolDescription
              description={tool.uiMetadata.description_short ?? ''}
            />
          </div>
        </div>
        <dl className={classes.body}>
          <div>
            <dt>Type of tool</dt>
            <dd>{isExternalTool(tool.type, tool.id) && <ToolExternalTag />}</dd>
          </div>
          <div>
            <dt>Detailed description</dt>
            <dd>
              <ToolDescription description={tool.user_description ?? ''} />
            </dd>
          </div>
          <div>
            <dt>Agent-facing description</dt>
            <dd>
              <div className={classes.agentDescription}>
                <code>{tool.description}</code>
              </div>
            </dd>
          </div>
        </dl>
      </ModalBody>
    </Modal>
  );
}
