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
import { createContext, PropsWithChildren, use, useState } from 'react';
import { Assistant } from '../../assistants/types';
import { AssistantModalRenderer } from '@/modules/assistants/detail/AssistantModalRenderer';

export interface AssistantModalContextValue {
  openAssistantModal: (assistant: Assistant) => void;
}

const AssistantModalContext = createContext<AssistantModalContextValue>(
  null as unknown as AssistantModalContextValue,
);

export function AssistantModalProvider({ children }: PropsWithChildren) {
  const [editAssistant, setEditAssistant] = useState<Assistant | null>(null);

  return (
    <AssistantModalContext.Provider
      value={{ openAssistantModal: setEditAssistant }}
    >
      {children}

      {editAssistant && (
        <AssistantModalRenderer
          assistant={editAssistant}
          isOpened={Boolean(editAssistant)}
          onModalClose={() => setEditAssistant(null)}
        />
      )}
    </AssistantModalContext.Provider>
  );
}

export function useAssistantModal() {
  const context = use(AssistantModalContext);

  if (!context) {
    throw new Error(
      'useAssistantModal must be used within a AssistantModalProvider',
    );
  }

  return context;
}
