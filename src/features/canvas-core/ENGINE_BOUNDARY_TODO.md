# Canvas-Core Extraction TODO

`canvas-core` should be engine-only. The files below are legacy boundary violations and should be extracted out of `canvas-core` in follow-up refactors instead of treated as valid ownership.

## Concrete Entity Ownership Still Inside `canvas-core`

- `elements/GoalElement.ts`
- `elements/StoryElement.ts`
- `elements/TaskElement.ts`
- `elements/PlanningElement.ts`
- `elements/ElementStatus.ts`
- `mappers/goal-mapper.ts`
- `mappers/story-mapper.ts`
- `mappers/task-mapper.ts`

## Product-Specific UI/Behavior Still Coupled To Those Entities

- `ui/SelectionActionMenu.ts`
- `ui/RelatedItemsPicker.ts`
- `ui/statusPresentation.ts`
- `adapters/planning/*`
- `CanvasApp.ts`

## Extraction Direction

1. Move concrete entity implementations and product semantics to `src/features/canvas`.
2. Keep generic engine contracts, runtime primitives, and reusable command infrastructure in `src/features/canvas-core`.
3. Replace direct `canvas-core -> concrete entity` coupling with adapters or generic interfaces.

## Rule

Do not add new files to the lists above under `canvas-core`.
