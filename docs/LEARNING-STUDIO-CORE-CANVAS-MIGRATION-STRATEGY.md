# Learning Studio Core-Canvas Role and Migration Strategy

## Status

- State: decision record
- Updated: 2026-03-28
- Scope: canvas role after the strategy reset and how current canvas work should be repurposed
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-STRATEGY-RESET.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Why this spec exists

The old question was:

- how do we migrate `Build` into a dedicated learning canvas?

That is no longer the right question.

The new question is:

- how do we repurpose canvas work into the right product role?

## Core Decision

Recommended rule:

- do not migrate `Build` toward canvas-first authoring
- migrate canvas work toward preview and learner runtime map use

## New Canvas Role

The learning canvas should now primarily support:

- interactive course map
- prerequisite visualization
- branching and alternate path understanding
- learner orientation and progress navigation
- creator preview of learner flow

It should not be the primary answer to:

- how a creator builds the course structure

## What remains valuable from current canvas work

The following investments are still useful:

- learning-specific node visuals
- learning-specific connection rendering
- map layout metadata
- map navigation chrome
- preview/runtime interaction patterns

These should be treated as seeds for:

- creator `Preview`
- learner runtime

## What should stop being the migration target

The following should no longer be the main destination:

- canvas-first `Build`
- drag-to-connect authoring as a normal creator path
- visible connection ports for course creation
- spatial course editing as the source of truth

## Recommended Architecture Boundary

### Domain

The learning domain owns:

- modules
- lessons
- exercises
- checkpoints
- prerequisites
- progress semantics

### Authoring UI

The structured builder owns:

- creation flows
- ordering
- outline/tree/list representation
- dense editing entry

### Map renderer

The canvas renderer owns:

- map drawing
- map layout metadata
- learner-facing orientation
- creator preview map

The map renderer should not own authoring truth.

## Layout State Strategy

Recommended rule:

- map layout state stays separate from canonical course structure

That means:

- authoring order does not depend on map placement
- preview/runtime map can evolve without rewriting authoring data
- courses can be authored without ever touching spatial layout tools

## Migration Stages

### Stage 1. Stop the wrong migration

- stop treating canvas authoring as the destination for `Build`
- keep `Build` on a structured-builder path

### Stage 2. Stabilize shared domain model

- keep one canonical course structure model
- keep prerequisites and branching as domain rules
- keep map layout metadata separate

### Stage 3. Turn current canvas into preview map

- use learning nodes and connections for creator preview
- validate path readability, blocking, and branching

### Stage 4. Turn preview map into learner runtime map

- reuse the same map language for real learner flow
- add runtime-specific progress and navigation behavior

### Stage 5. Expand map sophistication only when needed

- richer branching
- stronger map navigation
- advanced learner path views

## Non-Goals

- moving the whole creator experience onto a canvas
- forcing authors to create course structure through map gestures
- keeping legacy planning-style affordances just because canvas-core supports them

## Implementation Implication

Current learning canvas code should be evaluated with one question:

- does this help preview/runtime map quality?

If yes, keep or refine it.
If no, do not keep investing in it as authoring infrastructure.

## Final Rule

The correct migration is no longer:

- `Build -> better authoring canvas`

It is:

- `canvas experiments -> stronger preview map -> stronger learner runtime map`
