import type { AlignmentRect, AlignmentSubject } from './types.ts';

type AlignmentSubjectIndexQuery = {
  movingSubject: AlignmentSubject;
  limit?: number;
  include?: (subject: AlignmentSubject) => boolean;
};

export class AlignmentSubjectIndex {
  constructor(private readonly subjects: ReadonlyArray<AlignmentSubject>) {}

  public query(args: AlignmentSubjectIndexQuery): AlignmentSubject[] {
    const limit = Math.max(0, args.limit ?? Number.POSITIVE_INFINITY);
    const rankedSubjects = [...this.subjects]
      .filter((subject) => args.include?.(subject) ?? true)
      .sort((left, right) =>
        this.compareSubjects(left, right, args.movingSubject)
      );

    return Number.isFinite(limit)
      ? rankedSubjects.slice(0, limit)
      : rankedSubjects;
  }

  private compareSubjects(
    left: AlignmentSubject,
    right: AlignmentSubject,
    movingSubject: AlignmentSubject
  ): number {
    const scoreDelta =
      this.getRelevanceScore(right, movingSubject) -
      this.getRelevanceScore(left, movingSubject);
    if (scoreDelta !== 0) return scoreDelta;

    const gapDelta =
      this.getBoundsGap(left.bounds, movingSubject.bounds) -
      this.getBoundsGap(right.bounds, movingSubject.bounds);
    if (gapDelta !== 0) return gapDelta;

    return left.id.localeCompare(right.id);
  }

  private getRelevanceScore(
    subject: AlignmentSubject,
    movingSubject: AlignmentSubject
  ): number {
    let score = subject.priority ?? 0;

    if (
      movingSubject.scopeId &&
      subject.scopeId &&
      subject.scopeId === movingSubject.scopeId
    ) {
      score += 1000;
    }

    if (
      movingSubject.scopeKind === 'container' &&
      subject.scopeKind === 'container' &&
      movingSubject.scopeId &&
      subject.scopeId !== movingSubject.scopeId
    ) {
      score -= 120;
    }

    if (
      this.rangesOverlap(
        movingSubject.bounds.left,
        movingSubject.bounds.right,
        subject.bounds.left,
        subject.bounds.right
      )
    ) {
      score += 120;
    }

    if (
      this.rangesOverlap(
        movingSubject.bounds.top,
        movingSubject.bounds.bottom,
        subject.bounds.top,
        subject.bounds.bottom
      )
    ) {
      score += 120;
    }

    return score;
  }

  private getBoundsGap(left: AlignmentRect, right: AlignmentRect): number {
    const horizontalGap = this.getAxisGap(
      left.left,
      left.right,
      right.left,
      right.right
    );
    const verticalGap = this.getAxisGap(
      left.top,
      left.bottom,
      right.top,
      right.bottom
    );

    return horizontalGap + verticalGap;
  }

  private rangesOverlap(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number
  ): boolean {
    return Math.max(aStart, bStart) <= Math.min(aEnd, bEnd);
  }

  private getAxisGap(
    aStart: number,
    aEnd: number,
    bStart: number,
    bEnd: number
  ): number {
    if (this.rangesOverlap(aStart, aEnd, bStart, bEnd)) {
      return 0;
    }

    return Math.min(Math.abs(bStart - aEnd), Math.abs(aStart - bEnd));
  }
}
