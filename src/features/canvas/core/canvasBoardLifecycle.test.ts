import { describe, expect, it } from 'vitest';
import {
  isCanvasDeleteRequestedDetail,
  isCanvasFavoriteToggleFailedDetail,
  isCanvasFavoriteToggledDetail,
  isCanvasGroupUpdateFailedDetail,
  isCanvasGroupUpdatedDetail,
  isCanvasListUpdatedDetail,
  isCanvasRenameRequestedDetail,
  isCanvasSelectedDetail,
  isCanvasTitleChangedDetail,
  isCanvasTitleEditedDetail,
} from './canvasBoardLifecycle.ts';

describe('canvasBoardLifecycle guards', () => {
  it('validates title/detail payloads', () => {
    expect(isCanvasTitleEditedDetail({ title: 'Board' })).toBe(true);
    expect(isCanvasTitleEditedDetail({ title: 1 })).toBe(false);

    expect(isCanvasTitleChangedDetail({ title: 'Board' })).toBe(true);
    expect(isCanvasTitleChangedDetail({})).toBe(false);
  });

  it('validates selection and mutation requests', () => {
    expect(isCanvasSelectedDetail({ id: 'c-1', name: 'Alpha' })).toBe(true);
    expect(isCanvasSelectedDetail({ name: 'Alpha' })).toBe(false);

    expect(isCanvasRenameRequestedDetail({ id: 'c-1', name: 'Renamed' })).toBe(
      true
    );
    expect(isCanvasRenameRequestedDetail({ id: 'c-1' })).toBe(false);
  });

  it('validates list updates and favorite payloads', () => {
    expect(
      isCanvasListUpdatedDetail({
        canvases: [
          {
            id: 'c-1',
            name: 'Main',
            isFavorite: true,
            groupId: null,
            groupName: null,
          },
        ],
        activeId: 'c-1',
      })
    ).toBe(true);
    expect(isCanvasListUpdatedDetail({ canvases: {}, activeId: null })).toBe(
      false
    );

    expect(
      isCanvasFavoriteToggledDetail({
        id: 'c-1',
        isFavorite: false,
        previousIsFavorite: true,
      })
    ).toBe(true);
    expect(
      isCanvasFavoriteToggledDetail({ id: 'c-1', isFavorite: 'nope' })
    ).toBe(false);

    expect(
      isCanvasFavoriteToggleFailedDetail({
        id: 'c-1',
        previousIsFavorite: true,
      })
    ).toBe(true);
    expect(isCanvasFavoriteToggleFailedDetail({ id: 'c-1' })).toBe(false);
  });

  it('validates group and delete payloads', () => {
    expect(
      isCanvasGroupUpdatedDetail({
        id: 'c-1',
        groupId: 'g-1',
        groupName: 'Team',
        previousGroupId: null,
        previousGroupName: null,
      })
    ).toBe(true);
    expect(
      isCanvasGroupUpdatedDetail({
        id: 'c-1',
        groupId: undefined,
        groupName: null,
      })
    ).toBe(false);

    expect(
      isCanvasGroupUpdateFailedDetail({
        id: 'c-1',
        previousGroupId: null,
        previousGroupName: null,
      })
    ).toBe(true);
    expect(
      isCanvasGroupUpdateFailedDetail({ id: 'c-1', previousGroupId: null })
    ).toBe(false);

    expect(isCanvasDeleteRequestedDetail({})).toBe(true);
    expect(isCanvasDeleteRequestedDetail({ id: 'c-1' })).toBe(true);
    expect(isCanvasDeleteRequestedDetail({ id: 42 })).toBe(false);
  });
});
