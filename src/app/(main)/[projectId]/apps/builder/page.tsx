import { ensureAppBuilderAssistant } from '@/app/api/rsc';
import { AppBuilder } from '@/modules/apps/AppBuilder';
import { AppBuilderProvider } from '@/modules/apps/AppBuilderProvider';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';
import { notFound } from 'next/navigation';

interface Props {
  params: {
    projectId: string;
  };
}

export default async function AppsBuilderPage({
  params: { projectId },
}: Props) {
  const assistant = await ensureAppBuilderAssistant(projectId);
  if (!assistant) notFound();

  return (
    <LayoutInitializer layout={{ sidebarVisible: false }}>
      <AppBuilderProvider>
        <AppBuilder assistant={assistant} />
      </AppBuilderProvider>
    </LayoutInitializer>
  );
}
