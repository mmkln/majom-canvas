import { describe, expect, it } from 'vitest';
import { Scene } from '../scene/Scene.ts';
import { GoalElement } from '../../elements/GoalElement.ts';
import { StoryElement } from '../../elements/StoryElement.ts';
import { SelectionContext } from './SelectionContext.ts';

describe('SelectionContext', () => {
  it('returns the planning selection without the excluded target element', () => {
    const scene = new Scene();
    const goal = new GoalElement({ id: 'goal-1' });
    const story = new StoryElement({ id: 'story-1' });
    scene.addElement(goal);
    scene.addElement(story);
    scene.setSelected([goal, story]);

    const selection = SelectionContext.getPlanningSelectionExcluding(
      scene,
      story.id
    );

    expect(selection).toEqual([goal]);
  });

  it('returns an empty selection when the excluded target is the only selected planning element', () => {
    const scene = new Scene();
    const story = new StoryElement({ id: 'story-1' });
    scene.addElement(story);
    scene.setSelected([story]);

    const selection = SelectionContext.getPlanningSelectionExcluding(
      scene,
      story.id
    );

    expect(selection).toEqual([]);
  });
});
