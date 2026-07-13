// Import components
import { EdPathCopilotProvider } from "@/components/copilot/EdPathCopilotProvider";
import { AppShell } from "@/components/shell/AppShell";
import { LessonRunner } from "@/components/shell/LessonRunner";

// Interface for the lesson page props
interface LessonPageProps {
  params: Promise<{
    threadId: string;
  }>;
};

// Function to render the lesson page
export default async function LessonPage({ params }: LessonPageProps) {
  // Destructure the threadId from the params
  const { threadId } = await params;
  
  return (
    <EdPathCopilotProvider threadId={threadId}>
      <AppShell headerVariant="landing">
        <LessonRunner threadId={threadId} />
      </AppShell>
    </EdPathCopilotProvider>
  );
};