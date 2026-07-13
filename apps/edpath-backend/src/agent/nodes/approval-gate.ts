/**
 * Approval gate graph node (N2 / approval_gate).
 * HITL interrupt — presents the lesson plan for approve or request-changes.
 * On approve, routes to generate_mcq; on changes, back to plan_lesson.
 */
import { ApprovalDecisionSchema } from "@repo/schemas";
import { interrupt } from "@langchain/langgraph";
import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";
import type { ApprovalInterruptPayload } from "../types/interrupt.types.js";

// Define the function to create the approval gate node
export function approvalGateNode( state: GraphState ): ReturnType<typeof withCoAgentSnapshot> {
  // Get the plan from the state
  const plan = state.plan;

  // Check if the plan is not present
  if (!plan) {
    // Return the coagent snapshot with the last error
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "approval_gate",
        kind: "schema_drift",
        detail: "Cannot interrupt for approval without a plan",
      },
    });
  };

  // Interrupt for approval
  const rawApproval = interrupt< ApprovalInterruptPayload , unknown >({
    type: "approval",
    plan,
  });

  // Parse the approval decision
  const parsed = ApprovalDecisionSchema.safeParse(rawApproval);

  // Check if the approval decision is not valid
  if (!parsed.success) {
    // Return the coagent snapshot with the last error
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "approval_gate",
        kind: "schema_drift",
        detail: parsed.error.message,
      },
    });
  };

  // Get the approval decision
  const approval = parsed.data;

  // Return the coagent snapshot with the approval decision
  return withCoAgentSnapshot(state, {
    approval,
    phase:
      approval.decision === "approve" ? "quizzing" : "awaiting_approval",
  });
};