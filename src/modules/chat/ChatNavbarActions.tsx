import { OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { useRouter } from 'next-nprogress-bar';
import { Assistant } from '../assistants/types';
import { useDeleteAssistant } from '../assistants/builder/useDeleteAssistant';
import { useProjectContext } from '@/layout/providers/ProjectProvider';

interface Props {
  assistant: Assistant;
}

export function ChatNavbarActions({ assistant }: Props) {
  const router = useRouter();
  const { project } = useProjectContext();
  const { deleteAssistant } = useDeleteAssistant({
    assistant,
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
        onClick={() => deleteAssistant()}
      />
    </OverflowMenu>
  );
}
