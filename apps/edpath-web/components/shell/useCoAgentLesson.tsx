"use client";

/**
 * Production CoAgent bridge — state mirror, LangGraph interrupt resolution, and user intents.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCoAgent, useCopilotChatInternal, useLangGraphInterrupt } from "@copilotkit/react-core";
import { Role, TextMessage } from "@copilotkit/runtime-client-gql";

// Shared types
import type { ResumePayload } from "@repo/schemas";
import type { ApprovalDecision, CoAgentState } from "@repo/types";

// Internal lib
import { getEmptyCoAgentState } from "@/lib/empty-co-agent-state";
import { isLessonAlreadyInProgress } from "@/lib/lesson-in-progress";
import {
  isApprovalInterrupt,
  isAwaitInputInterrupt,
  parseApprovalInterruptValue,
} from "@/lib/lesson";

// Local types
import type {
  ApprovalInterruptBridgeProps,
  ApprovalInterruptValue,
  AwaitInputInterruptBridgeProps,
  AwaitInputInterruptValue,
  UseCoAgentLessonReturn,
} from "@/types/lesson";

// Define the constants
export const EDPATH_AGENT_ID = "edpath";

// Define the function to register the approval interrupt resolver without invoking it on mount
function ApprovalInterruptBridge({ onResolverReady, resolve }: ApprovalInterruptBridgeProps): null {
  // Keep the ref current via a committed effect (not a render-phase write) so the registered resolver always calls the latest interrupt resolve().
  const resolveRef = useRef(resolve);

  // Update the ref current value on every render
  useEffect(() => {
    resolveRef.current = resolve;
  });

  // Register the resolver on mount
  useEffect(() => {
    onResolverReady((decision: ApprovalDecision) => {
      resolveRef.current(decision as unknown as string);
    });

    return () => onResolverReady(null);
  }, [onResolverReady]);

  return null;
};

// Define the function to register the await input interrupt resolver for answer, help, advance, and retry
function AwaitInputInterruptBridge({ onResolverReady, resolve }: AwaitInputInterruptBridgeProps): null {
  // Keep the ref current via a committed effect (not a render-phase write) so the registered resolver always calls the latest interrupt resolve().
  const resolveRef = useRef(resolve);

  // Update the ref current value on every render
  useEffect(() => {
    resolveRef.current = resolve;
  });

  // Register the resolver on mount
  useEffect(() => {
    onResolverReady((payload: ResumePayload) => {
      resolveRef.current(payload as unknown as string);
    });

    return () => onResolverReady(null);
  }, [onResolverReady]);

  return null;
};

// Define the function to use the co agent lesson
export function useCoAgentLesson(threadId: string): UseCoAgentLessonReturn {
  // Get the empty state
  const emptyState = useMemo(() => getEmptyCoAgentState(), []);

  // Create the co agent
  const coAgent = useCoAgent<CoAgentState>({
    name: EDPATH_AGENT_ID,
  });

  // Get the append message, interrupt, is available, and is loading
  const { appendMessage, interrupt, isAvailable, isLoading } = useCopilotChatInternal();
  // Create the has started agent ref
  const hasStartedAgentRef = useRef<boolean>(false);
  // Create the normalized state
  const normalizedState = useMemo<CoAgentState>(() => {
    // Get the mirrored state
    const mirroredState = coAgent.state as Partial<CoAgentState> | undefined;

    // Return the normalized state
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
      helpThread: mirroredState?.helpThread ?? [],
    };
  }, [coAgent.state, emptyState]);
  
  // Create the approval resolver
  const [approvalResolver, setApprovalResolver] = useState<((decision: ApprovalDecision) => void) | null>(null);
  // Create the answer resolver
  const [answerResolver, setAnswerResolver] = useState<((payload: ResumePayload) => void) | null>(null);

  // Define the function to register the approval resolver
  const registerApprovalResolver = useCallback(
    (resolver: ((decision: ApprovalDecision) => void) | null): void => {
      setApprovalResolver(() => resolver);
    },
    [],
  );

  // Define the function to register the answer resolver
  const registerAnswerResolver = useCallback(
    (resolver: ((payload: ResumePayload) => void) | null): void => {
      setAnswerResolver(() => resolver);
    },
    [],
  );

  // Use the langgraph interrupt
  useLangGraphInterrupt<ApprovalInterruptValue | AwaitInputInterruptValue>({
    // Set the agent id
    agentId: EDPATH_AGENT_ID,
    // Set the enabled
    enabled: ({ eventValue }) => isApprovalInterrupt(eventValue) || isAwaitInputInterrupt(eventValue),
    // Render the interrupt
    render: ({ event, resolve }) => {
      // Parse the event value
      const eventValue = parseApprovalInterruptValue(event.value);

      // Check if the event is an approval interrupt
      if (isApprovalInterrupt(eventValue)) {
        // Render the approval interrupt bridge
        return (
          <ApprovalInterruptBridge
            onResolverReady={registerApprovalResolver}
            resolve={resolve}
          />
        );
      };

      // Check if the event is an await input interrupt
      if (isAwaitInputInterrupt(eventValue)) {
        // Render the await input interrupt bridge
        return (
          <AwaitInputInterruptBridge
            onResolverReady={registerAnswerResolver}
            resolve={resolve}
          />
        );
      };

      // Return an empty element
      return <></>;
    },
  });

  // Use the effect to start the agent
  useEffect(() => {
    if ( hasStartedAgentRef.current || !coAgent.threadId || coAgent.running || isLoading || !isAvailable || isLessonAlreadyInProgress(normalizedState) ) {
      return;
    };

    // Set the has started agent ref
    hasStartedAgentRef.current = true;

    // Set the start agent run
    const startAgentRun = window.setTimeout(() => {
      // Append the message
      void appendMessage(new TextMessage({
        // Set the id
        id: crypto.randomUUID(),
        role: Role.User,
        content: "Start the lesson.",
      }));
    }, 250);

    // Clear the timeout
    return () => window.clearTimeout(startAgentRun);
  }, [appendMessage, coAgent, isAvailable, isLoading, normalizedState]);

  // Define the function to approve the plan
  const approvePlan = useCallback((): void => {
    // Check if the approval resolver is not ready
    if (!approvalResolver) {
      // Check if the environment is development
      if (process.env.NODE_ENV === "development") {
        console.warn("[EdPath] approvePlan blocked: approval interrupt resolver is not ready.");
      };

      return;
    };

    // Call the approval resolver
    approvalResolver({ decision: "approve" });
  }, [approvalResolver]);

  // Define the function to request the plan revision
  const requestPlanRevision = useCallback((note: string): void => {
    // Trim the note
    const trimmed = note.trim();

    // Check if the note is not trimmed
    if (!trimmed) {
      return;
    };

    // Check if the approval resolver is not ready
    if (!approvalResolver) {
      // Check if the environment is development
      if (process.env.NODE_ENV === "development") {
        console.warn("[EdPath] requestPlanRevision blocked: approval interrupt resolver is not ready.");
      };

      return;
    };

    // Call the approval resolver
    approvalResolver({ decision: "changes", note: trimmed });
  }, [approvalResolver]);

  // Check if the approval resolver is not null and the phase is awaiting approval
  const canRequestPlanRevision = approvalResolver !== null && normalizedState.phase === "awaiting_approval";

    // Define the function to submit the answer
    const submitAnswer = useCallback((selectedIndex: number): void => {
        // Check if the answer resolver is not ready
        if (!answerResolver) {
          // Check if the environment is development
          if (process.env.NODE_ENV === "development") {
            console.warn("[EdPath] submitAnswer blocked: await_input interrupt resolver is not ready.");
          };

          return;
        };

        // Call the answer resolver
        answerResolver({
          kind: "answer",
          selectedIndex,
        });
      },
    [answerResolver]);

  // Define the function to submit the help
    const submitHelp = useCallback(
      (text: string): void => {
        const trimmed = text.trim();

        if (!trimmed) {
          return;
        }

        if (!answerResolver) {
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[EdPath] submitHelp blocked: await_input interrupt resolver is not ready.",
            );
          }
          return;
        }

        answerResolver({
          kind: "help",
          text: trimmed,
        });
      },
      [answerResolver],
    );

    // Define the function to advance
    const advance = useCallback((): void => {
      // Check if the answer resolver is not ready
      if (!answerResolver) {
        // Check if the environment is development
        if (process.env.NODE_ENV === "development") {
          console.warn("[EdPath] advance blocked: await_input interrupt resolver is not ready.");
        };

        return;
      };

      // Call the answer resolver
      answerResolver({ kind: "advance" });
    }, [answerResolver]);

    // Define the function to retry the generation
    const retryGeneration = useCallback((): void => {
      // Check if the answer resolver is not ready
      if (!answerResolver) {
        // Check if the environment is development
        if (process.env.NODE_ENV === "development") {
          console.warn("[EdPath] retryGeneration blocked: await_input interrupt resolver is not ready.");
        };

        return;
      };

      answerResolver({ kind: "retry" });
    }, [answerResolver]);

    // Check if the answer resolver is not null and the phase is awaiting input
    const canSubmitHelp = answerResolver !== null && normalizedState.phase === "awaiting_input";

  // Return the co agent lesson
  return {
    threadId,
    state: normalizedState,
    phase: normalizedState.phase,
    plan: normalizedState.plan,
    pdfTitle: normalizedState.pdfMeta.filename,
    isRunning: coAgent.running,
    canSubmitAnswer: answerResolver !== null,
    canSubmitHelp,
    canRequestPlanRevision,
    approvePlan,
    requestPlanRevision,
    submitAnswer,
    submitHelp,
    advance,
    retryGeneration,
    interruptElement: interrupt,
  };
};