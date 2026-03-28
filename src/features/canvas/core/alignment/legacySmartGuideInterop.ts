import type {
  SmartAlignmentCandidate,
  SmartAlignmentRect,
} from '../services/SmartAlignmentService.ts';
import type { AlignmentRect, AlignmentSubject } from './types.ts';

export function toSmartAlignmentRect(rect: AlignmentRect): SmartAlignmentRect {
  return { ...rect };
}

export function toSmartAlignmentCandidate(
  subject: AlignmentSubject
): SmartAlignmentCandidate {
  return {
    id: subject.id,
    bounds: toSmartAlignmentRect(subject.bounds),
  };
}
