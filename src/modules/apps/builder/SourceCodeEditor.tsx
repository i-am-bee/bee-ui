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

import { EditableSyntaxHighlighter } from '@/components/EditableSyntaxHighlighter/EditableSyntaxHighlighter';
import classes from './SourceCodeEditor.module.scss';
import { useEffect, useId, useRef, useState } from 'react';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import { Button } from '@carbon/react';
import { useChat } from '@/modules/chat/providers/ChatProvider';

interface Props {
  onSaveCode: () => void;
}

export function SourceCodeEditor({ onSaveCode }: Props) {
  const id = useId();
  const { setCode: saveCode } = useAppBuilderApi();
  const { code: savedCode } = useAppBuilder();
  const { status } = useChat();
  const [code, setCode] = useState(savedCode ?? '');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (savedCode) {
      setCode(savedCode);

      if (containerRef.current && status === 'fetching')
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [savedCode, status]);

  return (
    <div className={classes.root}>
      <div className={classes.code} ref={containerRef}>
        <EditableSyntaxHighlighter
          id={`${id}:code`}
          value={code ?? 'No code available'}
          onChange={setCode}
          required
          rows={16}
          readOnly={status === 'fetching'}
        />
      </div>
      <div className={classes.buttons}>
        <Button
          size="sm"
          kind="tertiary"
          className={classes.buttonCancel}
          disabled={!savedCode || code === savedCode}
          onClick={() => setCode(savedCode ?? '')}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          kind="secondary"
          disabled={code === savedCode}
          onClick={() => {
            saveCode(code);
            onSaveCode();
          }}
        >
          Apply changes
        </Button>
      </div>
    </div>
  );
}
