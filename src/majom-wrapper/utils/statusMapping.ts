import { Status } from '../interfaces/index.ts';
import { ElementStatus } from '../../features/canvas/elements/ElementStatus.ts';

/**
 * Map backend Status enum to UI ElementStatus
 */
export function mapStatus(status: Status): ElementStatus {
  switch (status) {
    case Status.Active:
      return ElementStatus.InProgress;
    case Status.Completed:
      return ElementStatus.Done;
    case Status.Archived:
      return ElementStatus.Done;
    case Status.Described:
      return ElementStatus.Pending;
    case Status.Draft:
      return ElementStatus.Defined;
    case Status.Cancelled:
      return ElementStatus.Done;
    default:
      return ElementStatus.Defined;
  }
}

/**
 * Map UI ElementStatus to backend Status enum
 */
export function mapStatusToBackend(status: ElementStatus): Status {
  switch (status) {
    case ElementStatus.InProgress:
      return Status.Active;
    case ElementStatus.Done:
      return Status.Completed;
    case ElementStatus.Pending:
      return Status.Described;
    case ElementStatus.Defined:
    default:
      return Status.Draft;
  }
}
