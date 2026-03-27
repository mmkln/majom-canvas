# Canvas Sharing And Templates

This document records the current product and architecture decision for canvas sharing and template-based canvas creation.

It exists so implementation can continue later without re-deriving the same conclusions from the current frontend model.

## Status

- State: proposal ready for implementation design
- Recorded: 2026-03-27
- Scope: canvas sharing, template canvases, clone semantics, permission boundaries

## Goal

Support two related capabilities:

- let one user share a canvas with other users
- let one user use an existing canvas as the basis for their own new canvas

The second case is the immediate priority.

## Confirmed Meaning Of "Same Elements"

When we say a user should get "the same elements" from another canvas, we do **not** mean reusing the same database records.

The confirmed meaning is:

- create a new canvas
- create new goal, story, and task records for the target user
- copy the source structure and content into those new records
- reset execution/progress state so the new user starts fresh

This is a template instantiation or clone flow, not shared ownership of the same entities.

## Current Code Reality

The current frontend model already separates some canvas-specific data from core entity data:

- canvas positions are canvas-scoped
- canvas relations are canvas-scoped
- canvas metadata is canvas-scoped

Relevant frontend files:

- `src/majom-wrapper/data-access/canvas-api-service.ts`
- `src/majom-wrapper/data-access/canvas-position-dto.ts`
- `src/majom-wrapper/data-access/canvas-relations-api-service.ts`
- `src/majom-wrapper/services/CanvasDataService.ts`

At the same time, core planning fields are still stored on the domain entities themselves:

- `Task`
- `Story`
- `Goal`

This includes fields such as:

- title
- description
- status
- priority
- completion-related state

Relevant frontend files:

- `src/majom-wrapper/interfaces/index.ts`
- `src/features/canvas/mappers/task-mapper.ts`
- `src/features/canvas/mappers/story-mapper.ts`
- `src/features/canvas/mappers/goal-mapper.ts`

## Key Architectural Consequence

Because status and completion state live on the domain entities rather than on the canvas layer, the system cannot safely support this model:

- multiple users pointing to the same underlying tasks/stories/goals
- while each user keeps independent execution status

That means the first template implementation should not try to reuse the same entity ids across multiple users.

## Recommended First Delivery

The recommended first implementation is:

- `template via clone`

Flow:

1. User selects an existing canvas as a template source.
2. System creates a new canvas owned by the target user.
3. System clones all source goals, stories, and tasks into new records.
4. System recreates canvas positions for the new canvas.
5. System recreates canvas relations for the new canvas using the new entity ids.
6. System resets execution/progress fields so the new canvas starts clean.

This delivers the requested user experience without requiring a full blueprint/runtime split in the data model.

## What Should Be Copied

The clone flow should copy, at minimum:

- canvas name or a derived name
- structural hierarchy between goals, stories, and tasks
- title
- description
- priority, if product wants templates to carry planning importance
- canvas positions
- canvas relations
- canvas metadata that is safe to carry forward

## What Should Be Reset

The clone flow should reset, at minimum:

- status
- `completed`
- `is_completed`
- resolved/completed timestamps
- activity history tied to prior execution

Any other execution-only fields should be reset as well.

## Open Product Decisions

These still need explicit confirmation before backend implementation:

- Should due dates be copied or reset?
- Should priority be copied or reset?
- Should every relation type be cloned, or only planning-safe relation types?
- Can any canvas become a template, or is there an explicit `mark as template` state?
- Can templates be private-only at first, or must they be shareable immediately?
- Is shared canvas access read-only first, or should editor access exist in the first release?

## Sharing vs Template Instantiation

These are related but should not be conflated.

### Shared canvas

This means access to an existing canvas owned by another user.

To support this properly, the backend needs:

- ownership model
- access control model
- share/revoke endpoints
- rules for viewer vs editor access
- rules for whether edits are live on the same shared canvas

This is a permissions feature.

### Template canvas

This means using an existing canvas as source material for a new personal canvas.

To support this properly, the backend needs:

- one clone or instantiate endpoint
- deterministic cloning of entities, layout, and relations
- reset rules for execution state
- source-to-clone trace metadata when useful

This is primarily a duplication and normalization feature.

## Recommended Delivery Order

1. Implement template instantiation through clone.
2. Add template metadata and source-trace metadata.
3. Add basic sharing permissions.
4. Only after that, consider live collaborative editing or a more advanced blueprint/runtime split.

## Suggested Metadata Direction

The current `canvas.meta` field is a reasonable place for lightweight frontend-compatible flags such as:

- `isTemplate`
- `templateSourceCanvasId`
- `clonedFromCanvasId`
- `templateVisibility`

This does not replace backend permission tables or dedicated template records, but it is a good compatibility layer for incremental rollout.

## Backend Work Required

The current frontend does not expose a complete contract for this feature yet.

At minimum, backend work will need:

- a clone/instantiate-template endpoint
- entity cloning logic for goals, stories, and tasks
- mapping logic from source entity ids/uuids to new entity ids/uuids
- layout cloning for canvas positions
- relation cloning for canvas relations
- reset rules for execution-state fields

For sharing, backend will additionally need:

- canvas ownership
- canvas ACL or share records
- list/filter behavior for accessible canvases
- optional collaboration policy

## Explicit Non-Goal For First Version

The first version should not try to make one underlying task/story/goal record belong to multiple users with separate progress state.

That would require a different domain model and should be treated as a later architectural step, not as part of the first delivery.
