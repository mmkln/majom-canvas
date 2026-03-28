import { describe, expect, it } from 'vitest';
import { AlignmentSubjectIndex } from './AlignmentSubjectIndex.ts';
import type { AlignmentSubject } from './types.ts';

function createSubject(
  id: string,
  bounds: AlignmentSubject['bounds'],
  overrides: Partial<AlignmentSubject> = {}
): AlignmentSubject {
  return {
    id,
    role: 'element',
    scopeKind: 'local',
    scopeId: null,
    bounds,
    anchors: [],
    ...overrides,
  };
}

describe('AlignmentSubjectIndex', () => {
  it('prioritizes same-container subjects ahead of global subjects', () => {
    const movingSubject = createSubject(
      '__moving__',
      {
        x: 100,
        y: 100,
        width: 120,
        height: 80,
        left: 100,
        right: 220,
        top: 100,
        bottom: 180,
        centerX: 160,
        centerY: 140,
      },
      {
        scopeKind: 'container',
        scopeId: 'story-1',
        priority: 320,
      }
    );
    const index = new AlignmentSubjectIndex([
      createSubject('global-task', {
        x: 221,
        y: 100,
        width: 120,
        height: 80,
        left: 221,
        right: 341,
        top: 100,
        bottom: 180,
        centerX: 281,
        centerY: 140,
      }),
      createSubject(
        'same-story-task',
        {
          x: 221,
          y: 100,
          width: 120,
          height: 80,
          left: 221,
          right: 341,
          top: 100,
          bottom: 180,
          centerX: 281,
          centerY: 140,
        },
        {
          scopeKind: 'container',
          scopeId: 'story-1',
        }
      ),
    ]);

    const result = index.query({ movingSubject });

    expect(result.map((subject) => subject.id)).toEqual([
      'same-story-task',
      'global-task',
    ]);
  });

  it('uses proximity as a deterministic tie-breaker when semantic score is equal', () => {
    const movingSubject = createSubject('__moving__', {
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      left: 100,
      right: 200,
      top: 100,
      bottom: 200,
      centerX: 150,
      centerY: 150,
    });
    const index = new AlignmentSubjectIndex([
      createSubject('far', {
        x: 600,
        y: 600,
        width: 100,
        height: 100,
        left: 600,
        right: 700,
        top: 600,
        bottom: 700,
        centerX: 650,
        centerY: 650,
      }),
      createSubject('near', {
        x: 240,
        y: 120,
        width: 100,
        height: 100,
        left: 240,
        right: 340,
        top: 120,
        bottom: 220,
        centerX: 290,
        centerY: 170,
      }),
    ]);

    const result = index.query({ movingSubject });

    expect(result.map((subject) => subject.id)).toEqual(['near', 'far']);
  });
});
