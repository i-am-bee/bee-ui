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

import { useAppContext } from '@/layout/providers/AppProvider';
import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { useRouter } from 'next-nprogress-bar';
import { useDeleteAssistant } from '../assistants/api/mutations/useDeleteAssistant';
import { Assistant } from '../assistants/types';

interface Props {
  assistant: Assistant;
}

export function ChatNavbarActions({ assistant }: Props) {
  const router = useRouter();
  const { project } = useAppContext();
  const { mutateAsyncWithConfirmation: deleteAssistant } = useDeleteAssistant({
    onSuccess: () => router.push(`/${project.id}/`),
  });

  return (
    <OverflowMenu size="sm" flipped>
      <OverflowMenuItem
        itemText="Edit"
        onClick={() => router.push(`/${project.id}/builder/${assistant.id}`)}
      />
      <OverflowMenuItem
        isDelete
        itemText="Delete"
        onClick={() => deleteAssistant(assistant)}
      />
    </OverflowMenu>
  );
}
