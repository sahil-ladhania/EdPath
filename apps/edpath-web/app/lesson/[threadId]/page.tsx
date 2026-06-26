import { EdPathCopilotProvider } from "@/components/copilot/EdPathCopilotProvider";
import { AppShell } from "@/components/shell/AppShell";
import { LessonRunner } from "@/components/shell/LessonRunner";

interface LessonPageProps {
  params: Promise<{
    threadId: string;
  }>;
}

export default async function LessonPage({
  params,
}: LessonPageProps) {
  const { threadId } = await params;

  return (
    <EdPathCopilotProvider threadId={threadId}>
      <AppShell headerVariant="landing">
        <LessonRunner threadId={threadId} />
      </AppShell>
    </EdPathCopilotProvider>
  );
}
