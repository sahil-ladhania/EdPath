import type { CoAgentState } from "@repo/types";

import {
  EDPATH_AGENT_ID,
  useCoAgentLesson,
} from "@/components/shell/useCoAgentLesson";

export function CoAgentLessonContract(): React.JSX.Element {
  const lesson = useCoAgentLesson("contract-thread");
  const firstQuestion = lesson.state.questions[0];
  acceptsOnlyPublicState(lesson.state);

  return (
    <div>
      <p>{EDPATH_AGENT_ID}</p>
      <p>{lesson.phase}</p>
      <p>{lesson.plan?.objectives[0]?.title}</p>
      <p>{firstQuestion?.question}</p>
    </div>
  );
}

function acceptsOnlyPublicState(state: CoAgentState): void {
  void state;
  return undefined;
}
