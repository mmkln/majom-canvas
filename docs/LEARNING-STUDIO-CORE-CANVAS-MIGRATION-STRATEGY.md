# Learning Studio Core-Canvas and Migration Strategy

## Status

- State: decision draft
- Updated: 2026-03-27
- Scope: migration strategy from temporary block-based surfaces to a dedicated learning canvas runtime
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`
  - `docs/LEARNING-STUDIO-STRUCTURED-LESSON-FORMAT-SPEC.md`

## Why this spec exists

The current planning canvas is too tightly optimized around planning entities and workflows to be treated as a drop-in learning canvas.

At the same time:

- the product still wants a canvas-first direction
- a temporary block-based shell is acceptable for early work

Without an explicit migration strategy, the project risks either:

- overcommitting to the temporary block renderer
- or prematurely coupling learning to planning-canvas assumptions

## Core Decision

Recommended v1 rule:

- the learning domain and interaction contract must be designed independently of the current planning-canvas implementation

This means:

- temporary block-based rendering is acceptable
- direct reuse of planning-canvas internals is not the source of truth
- future `core-canvas` work should consume learning-domain data through stable interfaces

## Product Position

The product remains:

- canvas-first

But the implementation path is:

- block-based shell first
- dedicated learning canvas later

This is acceptable only if the temporary renderer does not invent different behavior from the future interaction model.

## What must remain stable across migration

The following should not change when the center surface changes from block-based to real canvas:

- screen hierarchy
- author flow
- learner flow
- single-selection model in `Build`
- inspector-driven editing
- CTA hierarchy
- creation flows for modules, lessons, exercises, and checkpoints
- preview vs real learner runtime boundary

If these change during migration, the product will feel rewritten rather than upgraded.

## What is renderer-specific and allowed to change

These details may evolve between temporary shell and real canvas:

- exact layout engine
- drag-and-drop behavior
- zoom and pan behavior
- spatial positioning fidelity
- node and connector rendering details
- animation richness

These are implementation details, not product-contract decisions.

## Temporary Block-Based Shell Responsibilities

The temporary renderer must already support:

- clear hierarchy
- clear selection
- contextual create actions
- stable ordering
- inspector handoff
- readiness cues

It must not:

- introduce duplicate navigation models
- treat every card like an independent mini-screen
- invent interaction shortcuts that cannot survive a later canvas

## Dedicated Learning Canvas Responsibilities

The future dedicated learning canvas should eventually provide:

- learning-specific node rendering
- learning-specific container behavior
- connection rendering for prerequisites or sequencing
- shared author/learner presentation over the same domain model
- spatial navigation without inheriting planning-entity semantics

The canvas should feel native to learning, not like a planning board with relabeled boxes.

## Separation of Concerns

Recommended architecture boundary:

- learning domain owns course/module/lesson/exercise/checkpoint data
- learning UI state owns selection, focused item, open panels, and runtime mode
- renderer owns only drawing, layout interaction, and surface gestures

The renderer should not own:

- business rules for progress
- publication/versioning logic
- access logic
- learner runtime semantics

## Layout State Strategy

Recommended v1 rule:

- layout state should be stored separately from content structure

This makes migration safer because:

- content remains stable even if layout representation changes
- block-based ordering can later coexist with spatial layout metadata
- the product can gradually add position data without rewriting course content

## Migration Stages

### Stage 1: Stable block-based shell

- use block-based center workspace
- enforce the final interaction contract already defined in docs
- keep layout state simple

### Stage 2: Renderer abstraction

- extract a renderer-facing interface from the temporary build workspace
- keep domain and inspector behavior unchanged
- make selection and contextual actions independent from the current DOM layout

### Stage 3: Dedicated learning canvas

- introduce a learning-specific renderer
- preserve existing author flow and learner flow
- progressively replace block presentation with true spatial navigation

### Stage 4: Deeper learning interactions

- richer prerequisite graph expression
- more meaningful learner map navigation
- AI-assisted structural editing on-canvas

These belong only after the base migration is stable.

## Recommended Renderer Contract

The future renderer should be able to consume something conceptually like:

- `elements`
- `relationships`
- `selection`
- `layoutState`
- `mode`
- `allowedActions`

The exact API can evolve later, but the key rule is:

- renderer input should come from learning-domain state and UI state, not from planning-specific models

## Preview and Learner Implications

The same renderer may later support:

- `build`
- `preview`
- `learner`

But the mode must affect:

- visible chrome
- allowed actions
- side effects
- information density

It must not collapse these modes into one ambiguous runtime.

## Non-Goals for v1

- rewriting the planning canvas first
- forcing learning onto existing `Goal/Story/Task` renderer contracts
- building full graph editing before the product interaction model is stable
- perfect spatial layout tools in the first restart pass

## Decisions This Spec Resolves

- temporary block-based rendering is acceptable, but only as a transport layer for the real interaction model
- learning must not be permanently coupled to planning-canvas entity assumptions
- layout state should remain separate from course content
- migration should preserve UX contracts and change renderer details underneath them

## Recommended Next Documentation Step

After this spec, the next most useful document is:

- `Implementation Restart Plan`

That plan should define:

- which prototype code is discarded
- which module foundations remain
- what the first clean implementation increment is
