import { AssistantBuilderProvider } from '@/modules/assistants/builder/AssistantBuilderProvider';
import { Builder } from '@/modules/assistants/builder/Builder';
import { LayoutInitializer } from '@/store/layout/LayouInitializer';

export default async function AssistantBuilderPage() {
  return (
    <LayoutInitializer layout={{ sidebarVisible: false }}>
      <AssistantBuilderProvider>
        <Builder />
      </AssistantBuilderProvider>
    </LayoutInitializer>
  );
}
