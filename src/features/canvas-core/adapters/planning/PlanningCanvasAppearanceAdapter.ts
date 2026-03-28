import {
  FOCUS_COLOR,
  HIGHLIGHT_COLOR,
  SELECT_COLOR,
  FOCUS_STORY_FILL,
  HIGHLIGHT_STORY_FILL,
} from '../../core/constants.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { TaskElement } from '../../elements/TaskElement.ts';
import { CANVAS_INTERACTION_STATES } from '../../elements/interfaces/structuredCanvasNode.ts';
import { resolveGoalAppearance } from '../../elements/styles/goalAppearance.ts';
import { storyStyles } from '../../elements/styles/storyStyles.ts';
import { taskStyles } from '../../elements/styles/taskStyles.ts';
import type {
  CanvasAppearanceAdapter,
  CanvasAppearanceContext,
  CanvasElementAppearance,
} from '../CanvasAppearanceAdapter.ts';

export class PlanningCanvasAppearanceAdapter
  implements CanvasAppearanceAdapter
{
  public resolveElementAppearance(
    element: TaskElement | StoryElement | GoalElement,
    context: CanvasAppearanceContext
  ): CanvasElementAppearance | null {
    const isFocused = context.interactionStates.has(
      CANVAS_INTERACTION_STATES.focused
    );
    const isHighlighted = context.interactionStates.has(
      CANVAS_INTERACTION_STATES.highlighted
    );

    if (element instanceof TaskElement) {
      const style = taskStyles[element.status];
      return {
        fillColor: style.fillColor,
        chromeColor: isFocused
          ? FOCUS_COLOR
          : isHighlighted
            ? HIGHLIGHT_COLOR
            : style.borderColor,
        borderColor: isFocused
          ? FOCUS_COLOR
          : isHighlighted
            ? HIGHLIGHT_COLOR
            : context.selected
              ? SELECT_COLOR
              : style.borderColor,
      };
    }

    if (element instanceof StoryElement) {
      const style = storyStyles[element.status];
      return {
        fillColor: isFocused
          ? FOCUS_STORY_FILL
          : isHighlighted
            ? HIGHLIGHT_STORY_FILL
            : style.fillColor,
        chromeColor: isFocused
          ? FOCUS_COLOR
          : isHighlighted
            ? HIGHLIGHT_COLOR
            : style.borderColor,
        borderColor: isFocused
          ? FOCUS_COLOR
          : isHighlighted
            ? HIGHLIGHT_COLOR
            : context.selected
              ? SELECT_COLOR
              : style.borderColor,
      };
    }

    if (element instanceof GoalElement) {
      return resolveGoalAppearance({
        status: element.status,
        focused: isFocused,
        highlighted: isHighlighted,
        selected: context.selected,
      });
    }

    return null;
  }
}
