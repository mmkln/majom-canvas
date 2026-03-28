# Learning Studio Preview and Learner Runtime Spec

## Status

- State: decision record
- Updated: 2026-03-28
- Scope: creator preview behavior, learner runtime behavior, and the role of the interactive course map
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-STRATEGY-RESET.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-PROGRESS-ASSESSMENT-SPEC.md`
  - `docs/LEARNING-STUDIO-COURSE-MAP-INTEGRATION-SPEC.md`

## Why this spec exists

After the strategy reset, the canvas has a clearer home:

- not as the main authoring editor
- yes as the interactive course map for preview and learner runtime

This document defines that boundary.

## Core Decision

Recommended v1 rule:

- creator preview and learner runtime may both use an interactive course map as their main orientation shell

At the same time:

- creator preview remains a creator mode
- learner runtime remains a learner mode

They may share presentation language, but not data source, side effects, or permissions.

## Core Definitions

### Preview

A creator-facing validation environment used to inspect how the course would feel to a learner.

Preview should answer:

- where the learner starts
- what is available next
- what is blocked and why
- how the map reads
- whether branching and prerequisites are understandable

Preview may use the interactive map prominently because the map is now part of the validation job.

### Learner runtime

The actual learner-facing course experience on a published course version.

Learner runtime should support:

- orientation
- progression
- resuming
- path understanding
- real progress writing

### Interactive course map

A learner-facing map of modules, lessons, branches, and prerequisites.

Its job is to support:

- “Where am I?”
- “What can I open?”
- “What is blocked?”
- “What path makes sense next?”

It is not the primary authoring editor.

## Product Position

Recommended v1 rule:

- `Preview` and learner runtime should share map language
- `Build` should not

That gives one coherent visual/navigation model for course consumption and validation, while keeping authoring optimized for structure editing.

## Entry Points

### Creator preview entrypoint

The creator reaches preview from:

- `Course Overview`
- `Build`

Preview should feel like a validation detour from authoring.

### Learner runtime entrypoint

The learner reaches runtime from learner-facing entry points such as:

- course library
- enrollment link
- assigned course list

The learner should not enter through creator management screens.

## Content Source

### Preview content source

Recommended v1 rule:

- preview may read the current draft

This allows creators to validate unpublished changes.

Recommended implementation rule:

- `Preview` should receive a derived course-map model built from the current draft content
- the map model should be created in a dedicated map-integration layer, not inside the preview view itself

### Learner runtime content source

Recommended v1 rule:

- learner runtime must read a published course version

Learner runtime must never point directly at mutable draft content.

## Progress and Side Effects

### Preview

Preview uses sandbox progress only.

It may simulate:

- available
- blocked
- in progress
- completed

It must not write real learner progress.

### Learner runtime

Learner runtime writes real progress for the learner enrollment on a published course version.

## Permission Boundary

### Creator in preview can:

- jump freely through the map
- inspect blocked and available nodes
- see course-level validation context
- return to `Build`

### Creator in preview cannot:

- write real learner progress
- act as a real learner enrollment
- open creator editing chrome inside the core learner surface

### Learner can:

- follow the available path
- inspect the map at learner-facing density
- resume meaningful next steps
- write real progress

### Learner cannot:

- access creator editing controls
- validate draft-only content
- see creator-only management context

## Recommended Preview Layout

Preview should combine:

- interactive map for orientation
- focused lesson or unit presentation
- learner-facing progression cues
- a clear `Back to Build`

Preview should not collapse into:

- only one lesson card with no map context

Unless the course is extremely linear and the map adds no value.

## Recommended Learner Runtime Layout

Learner runtime should use the same core map language where helpful, but with learner-specific priorities:

- stronger resume cues
- clearer availability states
- minimal creator chrome
- stable progress context

For simple linear courses, the map may become compact or secondary.
For branching or prerequisite-heavy courses, the map may be the primary navigation shell.

## Map Node Quick Preview

Both `Preview` and learner runtime may use a lightweight node quick preview on top of the interactive map.

Recommended v1 rule:

- quick preview is for inspection
- focused lesson or unit routes are for real work

That means:

- quick preview may summarize a lesson, exercise, or checkpoint
- quick preview may explain blocked states and unmet prerequisites
- quick preview may provide one CTA into the focused lesson or unit route
- quick preview must remain read-only

Recommended surface:

- desktop: stable side panel attached to the map shell
- mobile: bottom sheet or full-screen sheet

Avoid:

- hover-only popovers
- narrow drawers as the main learner content surface
- treating quick preview as the primary runtime

History and state rules:

- opening quick preview should not create first-class route history
- panning, zooming, and transient map selection should not become durable navigation state
- entering the actual lesson or unit should create or update the focused runtime route
- reload and deep-link behavior should target the focused runtime route, not the quick preview surface

Blocked-node rule:

- blocked nodes may open quick preview
- blocked quick preview should explain the exact unmet prerequisite
- blocked quick preview should send the learner to the prerequisite, not into a dead-end runtime

## Map Design Rules

The interactive course map should optimize for:

- readability
- path understanding
- availability and blocking
- progress orientation

It should not optimize for:

- freeform editing
- author-only gestures
- visible connection ports
- graph theatrics
- mandatory preview hops before opening the recommended next step
- popover-style ephemeral reading surfaces for meaningful lesson inspection

## Preview vs Learner Runtime

### What should stay shared

- lesson presentation language
- unit hierarchy
- map language
- prerequisite visualization
- progress semantics language
- quick preview language for read-only node inspection

### What must stay different

- source of content
- ability to mutate real progress
- surrounding chrome
- management and editing controls

## Minimum v1 Success Criteria

`Preview` is successful when:

1. The creator can understand the learner path through the map quickly.
2. The creator can validate blocked vs available states.
3. Returning to `Build` is obvious and low-friction.

Learner runtime is successful when:

1. The learner can orient immediately.
2. The learner can see one clear next move.
3. Branches and prerequisites are understandable without creator knowledge.

## Final Rule

The interactive map belongs primarily to preview and learner runtime.
That is the canvas's strongest product role after the strategy reset.
