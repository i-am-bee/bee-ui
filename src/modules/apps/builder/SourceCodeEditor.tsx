import { EditableSyntaxHighlighter } from '@/components/EditableSyntaxHighlighter/EditableSyntaxHighlighter';
import classes from './SourceCodeEditor.module.scss';
import { useEffect, useId, useState } from 'react';
import { useAppBuilder, useAppBuilderApi } from './AppBuilderProvider';
import { Button } from '@carbon/react';

export function SourceCodeEditor() {
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
          onClick={() => saveCode(code)}
        >
          Apply changes
        </Button>
      </div>
    </div>
  );
}
