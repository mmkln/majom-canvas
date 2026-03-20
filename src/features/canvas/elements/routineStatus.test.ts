import { describe, expect, it } from 'vitest';
import { Status } from '../../../majom-wrapper/interfaces/index.ts';
import { ElementStatus } from './ElementStatus.ts';
import {
  getRoutineStatusIcon,
  getRoutineStatusLabel,
  mapRoutineStatusToBackend,
  normalizeRoutineStatus,
} from './routineStatus.ts';

describe('routineStatus', () => {
  it('normalizes legacy routine statuses to active', () => {
    expect(normalizeRoutineStatus(ElementStatus.Defined)).toBe(
      ElementStatus.InProgress
    );
    expect(normalizeRoutineStatus(ElementStatus.Pending)).toBe(
      ElementStatus.InProgress
    );
  });

  it('keeps archived routines mapped to done', () => {
    expect(normalizeRoutineStatus(ElementStatus.Done)).toBe(ElementStatus.Done);
    expect(getRoutineStatusLabel(ElementStatus.Done)).toBe('Archived');
    expect(getRoutineStatusIcon(ElementStatus.Done)).toBe('archive-box');
    expect(mapRoutineStatusToBackend(ElementStatus.Done)).toBe(Status.Archived);
  });

  it('maps active routines to in-progress semantics', () => {
    expect(getRoutineStatusLabel(ElementStatus.InProgress)).toBe('Active');
    expect(getRoutineStatusIcon(ElementStatus.InProgress)).toBe('arrow-path');
    expect(mapRoutineStatusToBackend(ElementStatus.InProgress)).toBe(
      Status.Active
    );
  });
});
