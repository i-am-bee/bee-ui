import { ToolReference } from '@/app/api/tools/types';
import {
  getStaticToolName,
  useToolInfo,
} from '@/modules/tools/hooks/useToolInfo';
import classes from './ToolNameWithTooltip.module.scss';
import { ToolInfoButton } from './ToolInfoButton';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props {
  toolReference: ToolReference;
}

export function ToolNameWithTooltip({ toolReference }: Props) {
  const { project, organization } = useProjectContext();
  const { toolName } = useToolInfo({ toolReference, project, organization });

  return (
    <span className={classes.root}>
      {toolName}
      <ToolInfoButton toolReference={toolReference} />
    </span>
  );
}
