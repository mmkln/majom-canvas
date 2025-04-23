import { Subject } from 'rxjs';
import type { TaskElement } from '../elements/TaskElement.ts';
import type { StoryElement } from '../elements/StoryElement.ts';
import type { GoalElement } from '../elements/GoalElement.ts';

// Central bus for edit element events
export const editElement$ = new Subject<
  TaskElement | StoryElement | GoalElement
>();
