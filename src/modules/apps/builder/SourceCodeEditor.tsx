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
import { useEffect, useId, useState } from 'react';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import { Button } from '@carbon/react';

interface Props {
  onSaveCode: () => void;
}

export function SourceCodeEditor({ onSaveCode }: Props) {
  const id = useId();
  const { setCode: saveCode } = useAppBuilderApi();
  const { code: savedCode } = useAppBuilder();
  const [code, setCode] = useState(savedCode ?? '');

  useEffect(() => {
    if (savedCode) setCode(savedCode);
  }, [savedCode]);

  return (
    <div className={classes.root}>
      <div className={classes.code}>
        <EditableSyntaxHighlighter
          id={`${id}:code`}
          value={code ?? 'No code available'}
          onChange={setCode}
          required
          rows={16}
        />
      </div>
      <div className={classes.buttons}>
        <Button
          size="sm"
          kind="tertiary"
          className={classes.buttonCancel}
          disabled={code === savedCode}
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
