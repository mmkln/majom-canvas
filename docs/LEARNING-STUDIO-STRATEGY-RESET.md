# Learning Studio Strategy Reset

## Status

- State: decision record
- Updated: 2026-03-28
- Scope: strategic reset of authoring vs canvas role
- Canonical parent doc: `docs/LEARNING-STUDIO.md`

## Why this reset exists

During implementation, one assumption became visibly wrong:

- a freeform canvas is not the right primary surface for course creation

It is a poor fit for the actual authoring job because course creation is mostly:

- hierarchical
- ordered
- repetitive
- dense in editing
- metadata-heavy

The canvas kept generating friction exactly where the author needs speed:

- adding many lessons
- editing details
- maintaining order
- making small corrections repeatedly

At the same time, the canvas kept feeling strong in a different job:

- understanding the course as a map
- seeing branches and prerequisites
- navigating through available and blocked paths
- presenting progress visually

This reset formalizes that split.

## Core Strategic Decision

Recommended product rule:

- `Build` is not a canvas editor
- the canvas is not the primary authoring surface
- the canvas is the interactive course map for preview and learner runtime

In short:

- `authoring = structured builder`
- `canvas = interactive map`

## What this changes

### Before

The project implicitly aimed at:

- canvas-first authoring
- canvas-first course structure editing
- canvas elements as the main creator work surface

### After

The project should aim at:

- structured-builder-first authoring
- list/tree/outline editing as the core creator workflow
- learner-facing or preview-facing map as the main canvas role

## New Product Model

### 1. Creator authoring

The creator should primarily work in a structured builder that is optimized for:

- creating modules
- creating lessons
- creating exercises and checkpoints
- reordering items
- opening focused edit surfaces
- making repeated content edits quickly

This is the job of `Build`.

### 2. Creator validation

The creator should validate the course through learner-oriented presentation.

This is the job of `Preview`.

`Preview` may use:

- the interactive map
- learner-style navigation
- sandbox progress
- prerequisite visibility

But it must remain:

- validation, not authoring

### 3. Learner runtime

The learner should move through the course in a learner-facing runtime.

This runtime may use:

- the same map language as preview
- the same lesson presentation language as preview

But it must remain distinct in:

- source of content
- permissions
- progress writes
- surrounding product context

## Why the canvas still matters

The reset is not anti-canvas.
It is anti-misuse of canvas.

The canvas is still strong when the job is:

- orientation
- branching visualization
- non-linear navigation
- progress understanding
- path selection

That makes it appropriate for:

- creator `Preview`
- learner runtime
- future learner map views

It is much less appropriate for:

- heavy authoring
- fast batch creation
- repeated edits in dense content

## Canonical Screen Roles After Reset

### Home

- course library
- entry to creation and reopening

### Overview

- orientation
- status
- next step

### Build

- structured authoring workspace
- no primary reliance on spatial canvas editing

### Preview

- creator-facing validation mode
- learner-oriented presentation
- may use the interactive course map prominently

### Learner Runtime

- actual learner experience
- may also use the interactive course map prominently

## Consequences for Existing Canvas Work

Existing learning-canvas work is not wasted, but it changes ownership.

What remains useful:

- learning-specific node visuals
- prerequisite rendering
- learner-oriented course map composition
- map navigation chrome
- preview/runtime map experiments

What should stop being a priority:

- canvas-first creation flow for modules, lessons, exercises, and checkpoints
- investing in author-only drag-to-create and drag-to-connect semantics
- treating canvas selection as the main course editing mode

## Consequences for Data Modeling

The domain model should remain independent of both:

- the structured authoring renderer
- the learner map renderer

Recommended rule:

- course structure is canonical
- map layout metadata is optional presentation metadata

This means:

- modules, lessons, exercises, checkpoints, prerequisites remain domain objects
- map positions are not the source of truth for structure
- authoring order does not depend on spatial placement

## Consequences for Build

`Build` should now optimize for:

- hierarchy
- order
- speed
- repetition
- clarity

The core UI language should be:

- outline
- tree
- list
- structured cards
- focused edit surfaces

Not:

- freeform board
- spatial graph editing
- gesture-heavy structural editing

## Consequences for Preview and Learner Runtime

`Preview` and learner runtime should optimize for:

- “Where am I?”
- “What can I do next?”
- “What is blocked and why?”
- “What path is available?”

That is where the canvas becomes a natural fit.

## Documentation Consequence

Older canvas-authoring documents are now historical references, not current strategy.

They may still contain useful observations about:

- element hierarchy
- map readability
- prerequisites
- visual language

But they should no longer be read as the current answer to:

- how creators build courses

## Implementation Priority After Reset

1. Re-center docs around structured authoring.
2. Stop treating canvas authoring as the target state.
3. Use canvas work to inform preview/runtime map design.
4. Build `Build` as a structured builder.
5. Build `Preview` and learner runtime around the interactive course map where that map improves understanding.

## Canonical One-Line Strategy

`Learning Studio` should let creators build courses in a structured builder and let creators and learners navigate courses through an interactive map when visual progression genuinely helps.
