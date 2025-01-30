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

import { Link } from '@/components/Link/Link';
import { useRoutes } from '@/routes/useRoutes';
import { useAppApiContext, useAppContext } from '../providers/AppProvider';
import { ActionButton } from './ActionButton';
import NewSession from './NewSession.svg';

export function NewSessionButton() {
  const { assistant } = useAppContext();
  const { routes } = useRoutes();
  const { onPageLeave } = useAppApiContext();

  return assistant ? (
    <Link href={routes.chat({ assistantId: assistant.id })} prefetch>
      <ActionButton
        kind="tertiary"
        iconDescription="New session"
        onClick={onPageLeave}
      >
        <NewSession />
      </ActionButton>
    </Link>
  ) : null;
}
