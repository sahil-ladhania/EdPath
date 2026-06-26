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
import type { ResumePayload } from "@repo/schemas";
import type { ApprovalDecision, CoAgentState, LessonPlan, Phase } from "@repo/types";

import { getEmptyCoAgentState } from "@/lib/empty-co-agent-state";
import { isLessonAlreadyInProgress } from "@/lib/lesson-in-progress";

export const EDPATH_AGENT_ID = "edpath";

interface ApprovalInterruptValue {
  type?: string;
  plan?: LessonPlan;
}

interface AwaitInputInterruptValue {
  type?: string;
}

interface UseCoAgentLessonReturn {
  threadId: string;
  state: CoAgentState;
  phase: Phase;
  plan: LessonPlan | null;
  pdfTitle: string;
  isRunning: boolean;
  canSubmitAnswer: boolean;
  approvePlan: () => void;
  submitAnswer: (selectedIndex: number) => void;
  interruptElement: ReactNode;
}

interface ApprovalInterruptBridgeProps {
  onApprove: () => void;
  onResolverReady: (resolver: (() => void) | null) => void;
}

interface AwaitInputInterruptBridgeProps {
  onResolverReady: (resolver: ((payload: ResumePayload) => void) | null) => void;
  resolve: (value: string) => void;
}

function parseApprovalInterruptValue(
  eventValue: ApprovalInterruptValue | string,
): ApprovalInterruptValue {
  if (typeof eventValue !== "string") {
    return eventValue;
  }

  try {
    return JSON.parse(eventValue) as ApprovalInterruptValue;
  } catch {
    return {};
  }
}

function parseAwaitInputInterruptValue(
  eventValue: AwaitInputInterruptValue | string,
): AwaitInputInterruptValue {
  if (typeof eventValue !== "string") {
    return eventValue;
  }

  try {
    return JSON.parse(eventValue) as AwaitInputInterruptValue;
  } catch {
    return {};
  }
}

function isApprovalInterrupt(eventValue: ApprovalInterruptValue | string): boolean {
  return parseApprovalInterruptValue(eventValue).type === "approval";
}

function isAwaitInputInterrupt(
  eventValue: AwaitInputInterruptValue | string,
): boolean {
  return parseAwaitInputInterruptValue(eventValue).type === "await_input";
}

function ApprovalInterruptBridge({
  onApprove,
  onResolverReady,
}: ApprovalInterruptBridgeProps): null {
  const onApproveRef = useRef(onApprove);
  onApproveRef.current = onApprove;

  useEffect(() => {
    onResolverReady(() => onApproveRef.current());

    return () => onResolverReady(null);
  }, [onResolverReady]);

  return null;
}

function AwaitInputInterruptBridge({
  onResolverReady,
  resolve,
}: AwaitInputInterruptBridgeProps): null {
  const resolveRef = useRef(resolve);
  resolveRef.current = resolve;

  useEffect(() => {
    onResolverReady((payload: ResumePayload) => {
      resolveRef.current(payload as unknown as string);
    });

    return () => onResolverReady(null);
  }, [onResolverReady]);

  return null;
}

export function useCoAgentLesson(threadId: string): UseCoAgentLessonReturn {
  const emptyState = useMemo(() => getEmptyCoAgentState(), []);
  const coAgent = useCoAgent<CoAgentState>({
    name: EDPATH_AGENT_ID,
  });
  const { appendMessage, interrupt, isAvailable, isLoading } =
    useCopilotChatInternal();
  const hasStartedAgentRef = useRef<boolean>(false);
  const normalizedState = useMemo<CoAgentState>(() => {
    const mirroredState = coAgent.state as Partial<CoAgentState> | undefined;

    return {
      ...emptyState,
      ...mirroredState,
      pdfMeta: mirroredState?.pdfMeta ?? emptyState.pdfMeta,
      plan: mirroredState?.plan ?? null,
      questions: mirroredState?.questions ?? [],
      score: mirroredState?.score ?? emptyState.score,
      results: mirroredState?.results ?? [],
      summary: mirroredState?.summary ?? null,
      phase: mirroredState?.phase ?? "planning",
      lastError: mirroredState?.lastError ?? null,
    };
  }, [coAgent.state, emptyState]);
  const [approvalResolver, setApprovalResolver] = useState<(() => void) | null>(
    null,
  );
  const [answerResolver, setAnswerResolver] = useState<
    ((payload: ResumePayload) => void) | null
  >(null);

  // A bare state setter treats a function argument as a functional updater and
  // *invokes* it instead of storing it — which would fire the interrupt's
  // resolve() the instant a bridge mounts (auto-approving the plan, and
  // resuming the answer gate with a null payload). Wrap in `() => resolver` so
  // the resolver function is stored, not called.
  const registerApprovalResolver = useCallback(
    (resolver: (() => void) | null): void => {
      setApprovalResolver(() => resolver);
    },
    [],
  );
  const registerAnswerResolver = useCallback(
    (resolver: ((payload: ResumePayload) => void) | null): void => {
      setAnswerResolver(() => resolver);
    },
    [],
  );

  // Single hook — two useLangGraphInterrupt instances fight over
  // copilotkit.setInterruptElement(); the last one with element=null wins and
  // prevents AwaitInputInterruptBridge from mounting (answerResolver stays null).
  useLangGraphInterrupt<ApprovalInterruptValue | AwaitInputInterruptValue>({
    agentId: EDPATH_AGENT_ID,
    enabled: ({ eventValue }) =>
      isApprovalInterrupt(eventValue) || isAwaitInputInterrupt(eventValue),
    render: ({ event, resolve }) => {
      const eventValue = parseApprovalInterruptValue(event.value);

      if (isApprovalInterrupt(eventValue)) {
        const approve = (): void => {
          const approval: ApprovalDecision = { decision: "approve" };
          resolve(approval as unknown as string);
        };

        return (
          <ApprovalInterruptBridge
            onApprove={approve}
            onResolverReady={registerApprovalResolver}
          />
        );
      }

      if (isAwaitInputInterrupt(eventValue)) {
        return (
          <AwaitInputInterruptBridge
            onResolverReady={registerAnswerResolver}
            resolve={resolve}
          />
        );
      }

      return <></>;
    },
  });

  useEffect(() => {
    if (
      hasStartedAgentRef.current ||
      !coAgent.threadId ||
      coAgent.running ||
      isLoading ||
      !isAvailable ||
      isLessonAlreadyInProgress(normalizedState)
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
  }, [appendMessage, coAgent, isAvailable, isLoading, normalizedState]);

  const approvePlan = useCallback((): void => {
    approvalResolver?.();
  }, [approvalResolver]);

  const submitAnswer = useCallback(
    (selectedIndex: number): void => {
      if (!answerResolver) {
        if (process.env.NODE_ENV === "development") {
          console.warn(
            "[EdPath] submitAnswer blocked: await_input interrupt resolver is not ready.",
          );
        }
        return;
      }

      answerResolver({
        kind: "answer",
        selectedIndex,
      });
    },
    [answerResolver],
  );

  return {
    threadId,
    state: normalizedState,
    phase: normalizedState.phase,
    plan: normalizedState.plan,
    pdfTitle: normalizedState.pdfMeta.filename,
    isRunning: coAgent.running,
    canSubmitAnswer: answerResolver !== null,
    approvePlan,
    submitAnswer,
    interruptElement: interrupt,
  };
}
