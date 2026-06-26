import { ApprovalDecisionSchema } from "@repo/schemas";
import { interrupt } from "@langchain/langgraph";

import type { GraphState } from "../state/annotation.js";
import { withCoAgentSnapshot } from "../state/graph-update.js";
import type { ApprovalInterruptPayload } from "../types/interrupt.types.js";

export function approvalGateNode(
  state: GraphState,
): ReturnType<typeof withCoAgentSnapshot> {
  const plan = state.plan;
  if (!plan) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "approval_gate",
        kind: "schema_drift",
        detail: "Cannot interrupt for approval without a plan",
      },
    });
  }

  const rawApproval = interrupt<
    ApprovalInterruptPayload,
    unknown
  >({
    type: "approval",
    plan,
  });

  const parsed = ApprovalDecisionSchema.safeParse(rawApproval);
  if (!parsed.success) {
    return withCoAgentSnapshot(state, {
      lastError: {
        node: "approval_gate",
        kind: "schema_drift",
        detail: parsed.error.message,
      },
    });
  }

  const approval = parsed.data;

  return withCoAgentSnapshot(state, {
    approval,
    phase:
      approval.decision === "approve" ? "quizzing" : "awaiting_approval",
  });
}
