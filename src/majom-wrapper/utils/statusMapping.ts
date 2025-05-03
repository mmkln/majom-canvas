import { Status } from '../interfaces/index.ts';
import { ElementStatus } from '../../elements/ElementStatus.ts';

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
