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
import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { getStaticToolName } from '../hooks/useToolInfo';
import { getToolReferenceFromTool } from '../utils';
import classes from './ToolDisableModal.module.scss';

interface Props extends ModalProps {
  tool: Tool;
  onDisableClick: () => void;
}

export function ToolDisableModal({ tool, onDisableClick, ...props }: Props) {
  const content = getContent(tool);

  return (
    <Modal {...props} preventCloseOnClickOutside className={classes.modal}>
      <ModalHeader>
        <h2>Disable {getStaticToolName(getToolReferenceFromTool(tool))}?</h2>
      </ModalHeader>

      <ModalBody>{content}</ModalBody>

      <ModalFooter>
        <div className={classes.actions}>
          <Button kind="ghost" size="md" onClick={() => props.onRequestClose()}>
            Cancel
          </Button>

          <Button
            kind="secondary"
            size="md"
            onClick={() => {
              onDisableClick();
              props.onRequestClose();
            }}
          >
            Disable
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

function getContent(tool: Tool) {
  const toolName = getStaticToolName(getToolReferenceFromTool(tool));

  if (tool.type === 'file_search') {
    return (
      <>
        <p>
          <strong>Warning:</strong> If you disconnect {toolName}, this agent
          will lose the ability to read and interpret larger or more complex
          files.
        </p>

        <p>
          This will limit file-related tasks, including those involving the
          knowledge base (if applicable) and any files uploaded during a
          session.
        </p>
      </>
    );
  } else if (tool.type === 'code_interpreter') {
    return (
      <>
        <p>
          <strong>Warning:</strong> If you disconnect {toolName}, this agent
          will lose its ability to run Python code for tasks like data analysis,
          file processing, and visualizations.
        </p>

        <p>
          This agent will also lose its ability to create or modify files,
          including those in the connected knowledge base (if applicable) and
          any uploaded during the session.
        </p>
      </>
    );
  } else if (tool.type === 'system' && tool.id === 'read_file') {
    return (
      <>
        <p>
          <strong>Warning:</strong> If you disconnect {toolName}, this agent
          will lose the ability to read and interpret basic files.
        </p>

        <p>
          This will limit file-related tasks, including those involving the
          knowledge base (if applicable) and any files uploaded during a
          session.
        </p>
      </>
    );
  }

  return null;
}
