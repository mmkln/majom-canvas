export type AiAssistantStrategicPlanMode =
  | 'canvas_bootstrap'
  | 'goal_subgoals'
  | 'goal_replan';

export type AiAssistantBreakdownMode =
  | 'goal_stories'
  | 'story_tasks'
  | 'task_refine'
  | 'unspecified_goal_decomposition';

export type AiAssistantIntentContext = {
  strategicPlanMode?: AiAssistantStrategicPlanMode;
  breakdownMode?: AiAssistantBreakdownMode;
};
