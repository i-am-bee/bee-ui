import { ToolReference } from '@/app/api/tools/types';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import classes from './ToolInfoButton.module.scss';
import { ArrowUpRight, Information } from '@carbon/react/icons';
import { useToolInfo } from '@/modules/tools/hooks/useToolInfo';
import { useProjectContext } from '@/layout/providers/ProjectProvider';
import { LinkButton } from '@/components/LinkButton/LinkButton';
import { useModal } from '@/layout/providers/ModalProvider';
import { UserToolModal } from '@/modules/tools/manage/UserToolModal';
import { PublicToolModal } from '@/modules/tools/manage/PublicToolModal';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props {
  toolReference: ToolReference;
}

export function ToolInfoButton({ toolReference }: Props) {
  const { isProjectReadOnly } = useAppContext();
  const { project, organization } = useProjectContext();
  const { openModal } = useModal();
  const { tool } = useToolInfo({ toolReference, project, organization });

  if (!tool) return;

  return (
    <Tooltip
      asChild
      content={
        <div className={classes.tooltip}>
          <span>{tool.description}</span>
          <LinkButton
            icon={ArrowUpRight}
            onClick={() =>
              openModal((props) =>
                tool.type === 'user' ? (
                  isProjectReadOnly ? (
                    <UserToolModal.View tool={tool} {...props} />
                  ) : (
                    <UserToolModal
                      {...props}
                      project={project}
                      organization={organization}
                      tool={tool}
                    />
                  )
                ) : (
                  <PublicToolModal
                    organization={organization}
                    project={project}
                    {...props}
                    tool={tool}
                  />
                ),
              )
            }
          >
            View Details
          </LinkButton>
        </div>
      }
      placement="top"
    >
      <button className={classes.root}>
        <Information />
      </button>
    </Tooltip>
  );
}
