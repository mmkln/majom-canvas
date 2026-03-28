import { Subject } from 'rxjs';
import type { CanvasPlanningElement } from '../elements/utils/planningElementCapabilities.ts';

// Central bus for edit element events
export const editElement$ = new Subject<CanvasPlanningElement>();
