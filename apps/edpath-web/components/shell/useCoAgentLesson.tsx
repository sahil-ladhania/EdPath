"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  useCoAgent,
  useCopilotChatInternal,
  useLangGraphInterrupt,
} from "@copilotkit/react-core";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";
import type { ApprovalDecision, CoAgentState, LessonPlan, Phase } from "@repo/types";

import { Button } from "@/components/ui/button";
import { getMockCoAgentState } from "@/lib/mock-lesson";

export const EDPATH_AGENT_ID = "edpath";

interface ApprovalInterruptValue {
  type?: string;
  plan?: LessonPlan;
}

interface UseCoAgentLessonReturn {
  threadId: string;
  state: CoAgentState;
  phase: Phase;
  plan: LessonPlan | null;
  pdfTitle: string;
  approvePlan: () => void;
  interruptElement: ReactNode;
}

interface ApprovalInterruptCardProps {
  eventValue: ApprovalInterruptValue;
  onApprove: () => void;
  onResolverReady: (resolver: (() => void) | null) => void;
}

function parseApprovalInterruptValue(
  eventValue: ApprovalInterruptValue | string,
): ApprovalInterruptValue {
  if (typeof eventValue !== "string") {
    return eventValue;
  }

  try {
    const parsed = JSON.parse(eventValue) as ApprovalInterruptValue;

    return parsed;
  } catch {
    return {};
  }
}

function isApprovalInterrupt(eventValue: ApprovalInterruptValue | string): boolean {
  return parseApprovalInterruptValue(eventValue).type === "approval";
}

function ApprovalInterruptCard({
  eventValue,
  onApprove,
  onResolverReady,
}: ApprovalInterruptCardProps): React.JSX.Element {
  const objectiveCount = eventValue.plan?.objectives.length ?? 0;

  useEffect(() => {
    onResolverReady(() => onApprove);

    return () => onResolverReady(null);
  }, [onApprove, onResolverReady]);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-5 shadow-sm">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">Approval needed</p>
        <p className="text-sm text-ink-muted">
          The LangGraph stub is paused at the fake approval interrupt
          {objectiveCount > 0 ? ` with ${objectiveCount} objective(s).` : "."}
        </p>
      </div>
      <Button onClick={onApprove}>Resolve approval interrupt</Button>
    </div>
  );
}

export function useCoAgentLesson(threadId: string): UseCoAgentLessonReturn {
  const initialState = useMemo(() => getMockCoAgentState(), []);
  const coAgent = useCoAgent<CoAgentState>({
    name: EDPATH_AGENT_ID,
  });
  const { appendMessage, interrupt, isAvailable, isLoading } =
    useCopilotChatInternal();
  const hasStartedAgentRef = useRef<boolean>(false);
  const normalizedState = useMemo<CoAgentState>(() => {
    const mirroredState = coAgent.state as Partial<CoAgentState> | undefined;

    return {
      ...initialState,
      ...mirroredState,
      pdfMeta: mirroredState?.pdfMeta ?? initialState.pdfMeta,
      plan: mirroredState?.plan ?? initialState.plan,
      questions: mirroredState?.questions ?? initialState.questions,
      score: mirroredState?.score ?? initialState.score,
      results: mirroredState?.results ?? initialState.results,
      summary: mirroredState?.summary ?? initialState.summary,
    };
  }, [coAgent.state, initialState]);
  const [approvalResolver, setApprovalResolver] = useState<(() => void) | null>(
    null,
  );

  useLangGraphInterrupt<ApprovalInterruptValue>({
    agentId: EDPATH_AGENT_ID,
    enabled: ({ eventValue }) => isApprovalInterrupt(eventValue),
    render: ({ event, resolve }) => {
      const eventValue = parseApprovalInterruptValue(event.value);
      const approve = (): void => {
        const approval: ApprovalDecision = { decision: "approve" };
        resolve(approval as unknown as string);
      };

      return (
        <ApprovalInterruptCard
          eventValue={eventValue}
          onApprove={approve}
          onResolverReady={setApprovalResolver}
        />
      );
    },
  });

  useEffect(() => {
    if (
      hasStartedAgentRef.current ||
      !coAgent.threadId ||
      coAgent.running ||
      isLoading ||
      !isAvailable
    ) {
      return;
    }

    hasStartedAgentRef.current = true;
    const startAgentRun = window.setTimeout(() => {
      void appendMessage(new TextMessage({
        id: crypto.randomUUID(),
        role: Role.User,
        content: "Start the lesson.",
      }));
    }, 250);

    return () => window.clearTimeout(startAgentRun);
  }, [appendMessage, coAgent, isAvailable, isLoading]);

  const approvePlan = useCallback((): void => {
    approvalResolver?.();
  }, [approvalResolver]);

  return {
    threadId,
    state: normalizedState,
    phase: normalizedState.phase,
    plan: normalizedState.plan,
    pdfTitle: normalizedState.pdfMeta.filename,
    approvePlan,
    interruptElement: interrupt,
  };
}
