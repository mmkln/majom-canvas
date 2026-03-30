import { describe, expect, it } from 'vitest';
import { ExistingGoalPickerQueryModel } from './ExistingGoalPickerQueryModel.ts';

describe('ExistingGoalPickerQueryModel', () => {
  it('commits exact #slug tokens into active tag filters and removes them from the text query', () => {
    const model = new ExistingGoalPickerQueryModel();
    model.resolveTags([
      createTag({ id: 11, title: 'Focus', slug: 'focus' }),
    ]);
    model.setInputValue('roadmap #focus');

    const request = model.commitInput('explicit');
    const snapshot = model.getSnapshot();

    expect(request).toEqual({
      term: 'roadmap',
      tagIds: [11],
    });
    expect(snapshot.inputValue).toBe('roadmap');
    expect(snapshot.selectedTags.map((tag) => tag.id)).toEqual([11]);
  });

  it('commits multiple #slug tokens regardless of where they appear in the query', () => {
    const model = new ExistingGoalPickerQueryModel();
    model.resolveTags([
      createTag({ id: 11, title: 'Focus', slug: 'focus' }),
      createTag({ id: 12, title: 'Health', slug: 'health' }),
    ]);
    model.setInputValue('#health roadmap #focus');

    expect(model.commitInput('explicit')).toEqual({
      term: 'roadmap',
      tagIds: [12, 11],
    });
  });

  it('keeps an exact trailing #slug as draft during passive debounce commits', () => {
    const model = new ExistingGoalPickerQueryModel();
    model.resolveTags([
      createTag({ id: 11, title: 'Focus', slug: 'focus' }),
    ]);
    model.setInputValue('roadmap #focus');

    expect(model.commitInput('auto')).toEqual({
      term: 'roadmap',
      tagIds: [],
    });
    expect(model.getSnapshot().inputValue).toBe('roadmap #focus');
  });

  it('does not trim plain free-text draft during passive debounce commits', () => {
    const model = new ExistingGoalPickerQueryModel();
    model.resolveTags([
      createTag({ id: 11, title: 'Focus', slug: 'focus' }),
    ]);
    model.setInputValue('roadmap ');

    expect(model.commitInput('auto')).toEqual({
      term: 'roadmap',
      tagIds: [],
    });
    expect(model.getSnapshot().inputValue).toBe('roadmap ');
  });

  it('keeps unresolved #fragments out of the text request while still surfacing tag suggestions', () => {
    const model = new ExistingGoalPickerQueryModel();
    model.resolveTags([
      createTag({ id: 11, title: 'Focus', slug: 'focus' }),
      createTag({ id: 12, title: 'Health', slug: 'health' }),
    ]);
    model.setInputValue('roadmap #fo');

    const request = model.getRequest();
    const snapshot = model.getSnapshot();

    expect(request).toEqual({
      term: 'roadmap',
      tagIds: [],
    });
    expect(snapshot.pendingHashQuery).toBe('fo');
    expect(snapshot.suggestedTags.map((tag) => tag.id)).toEqual([11]);
  });

  it('applies a suggested tag by consuming only the active hash fragment and leaving the rest of the query intact', () => {
    const model = new ExistingGoalPickerQueryModel();
    model.resolveTags([
      createTag({ id: 11, title: 'Focus', slug: 'focus' }),
    ]);
    model.setInputValue('roadmap #fo');

    const request = model.applySuggestedTag(11);

    expect(request).toEqual({
      term: 'roadmap',
      tagIds: [11],
    });
    expect(model.getSnapshot().inputValue).toBe('roadmap');
  });

  it('removes an active tag without resurrecting the consumed #slug text', () => {
    const model = new ExistingGoalPickerQueryModel();
    model.resolveTags([
      createTag({ id: 11, title: 'Focus', slug: 'focus' }),
    ]);
    model.setInputValue('roadmap #focus');
    model.commitInput('explicit');

    expect(model.removeTag(11)).toEqual({
      term: 'roadmap',
      tagIds: [],
    });
    expect(model.getSnapshot().inputValue).toBe('roadmap');
  });
});

function createTag(overrides: Partial<any>) {
  return {
    id: overrides.id ?? 1,
    title: overrides.title ?? 'Focus',
    slug: overrides.slug ?? 'focus',
    color: overrides.color ?? '#2563eb',
    description: overrides.description ?? null,
    tasks: overrides.tasks ?? [],
  };
}
