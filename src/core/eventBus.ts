import { Subject } from 'rxjs';
import type { Task } from '../elements/Task.ts';
import type { Story } from '../elements/Story.ts';
import type { Goal } from '../elements/Goal.ts';

// Central bus for edit element events
export const editElement$ = new Subject<Task | Story | Goal>();
