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

import { ToolToggle } from '@/modules/assistants/tools/ToolToggle';
import { toolsEqual, toolIncluded } from '@/modules/tools/utils';
import { Assistant } from '@/modules/assistants/types';
import { useChat } from '../providers/ChatProvider';
import { EmptyList } from './EmptyList';
import classes from './ThreadTools.module.scss';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props {
  assistantTools?: Assistant['tools'];
}

export function ThreadTools({ assistantTools = [] }: Props) {
  const { disabledTools, setDisabledTools } = useChat();
  const { organization, project } = useAppContext();

  if (assistantTools.length === 0) {
    return (
      <EmptyList
        heading="No tools connected"
        content="This bee does not use any tools. You can fork and edit this bee in bee details if you’d like to connect tools."
      />
    );
  }

  return (
    <ul className={classes.root}>
      {assistantTools.map((tool, index) => {
        const toolReference =
          tool.type === 'system'
            ? {
                type: tool.type,
                id: tool.system.id,
              }
            : tool.type === 'user'
              ? {
                  type: tool.type,
                  id: tool.user.tool.id,
                }
              : {
                  type: tool.type,
                  id: tool.type,
                };
        const toggled = !toolIncluded(disabledTools, tool);

        return (
          <li className={classes.item} key={index}>
            <ToolToggle
              organization={organization}
              project={project}
              tool={toolReference}
              toggled={toggled}
              onToggle={() =>
                setDisabledTools(
                  toggled
                    ? [...disabledTools, tool]
                    : disabledTools.filter((t) => !toolsEqual(t, tool)),
                )
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
