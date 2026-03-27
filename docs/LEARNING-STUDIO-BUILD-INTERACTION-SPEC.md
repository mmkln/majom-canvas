# Learning Studio Build Interaction Spec

## Status

- State: decision draft
- Updated: 2026-03-27
- Scope: creator-facing interaction contract for the `Build` screen
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Why this spec exists

The creator flow is now defined at the screen level, but the most important working surface is still under-specified:

- how the creator adds modules
- how the creator adds lessons and exercises
- what edits happen inline
- what edits happen in the inspector
- where primary and contextual actions live
- how selection and reordering work

Without this contract, the `Build` screen will keep drifting between:

- page-like forms
- noisy card collections
- fake-canvas experiments

This document defines the recommended v1 interaction model for `Build`.

## Core Decision

Recommended v1 rule:

- `Build` is one structured authoring workspace

It is not:

- a set of equal-weight mode buttons
- a pure form page
- a collection of random action cards

It should feel like one focused workspace with clear hierarchy, clear selection, and context-aware actions.

## Renderer-Agnostic Rule

This spec intentionally defines interaction behavior separately from rendering technology.

That means:

- the same interaction contract should work in a temporary block-based shell
- and later in a dedicated `core-canvas` implementation

The creator should not need to relearn the product because the center surface changes from blocks to a real canvas.

## Primary Job of Build

The creator uses `Build` to:

- shape the course structure
- add required learning units
- sequence modules and lessons
- edit metadata and prerequisites
- understand what is still missing before preview or publishing

## Build Screen Layout

Recommended v1 layout:

- top: course-stage header
- left: structure rail
- center: main build workspace
- right: inspector panel

## 1. Course-stage header

The top header should contain:

- course title and lightweight context
- current stage label: `Build`
- primary CTA: `Add module`
- secondary CTA: `Preview`
- overflow or secondary management actions, if needed

The header should **not** contain:

- `Add lesson`
- `Add exercise`
- repeated actions that only make sense inside a specific module

Reason:

- module creation is the top-level structural action
- lesson and exercise creation are contextual, not global

## 2. Structure rail

The left rail should be a compact orientation and navigation surface.

It should show:

- course overview node
- modules in sequence
- selected module or selected lesson context
- readiness cues such as missing lessons or incomplete required metadata

The structure rail should allow:

- selecting a module
- selecting a lesson
- quickly jumping across the course

The structure rail should **not** become a second full editing surface.

It should not contain:

- duplicated `Add module` buttons at multiple levels
- large editing forms
- repeated per-item action menus that already exist in the main workspace

## 3. Main build workspace

The center workspace is the main work surface.

Its job is to:

- show the current course structure in an editable spatial or block-based form
- make the selected context obvious
- make the next structural action obvious

Recommended v1 representation:

- modules as strong container blocks
- lessons as primary child cards inside modules
- exercises and checkpoints as secondary child units attached to lessons

The workspace should communicate hierarchy immediately.

## 4. Inspector panel

The right-side inspector is the main editing surface for selected content.

Its job is to hold edits that would otherwise clutter the main workspace.

Recommended inspector targets:

- course metadata
- module metadata
- lesson metadata
- lesson description and type
- prerequisites
- readiness hints
- advanced or less frequent settings

The inspector should react to one selected element at a time.

## Primary CTA Rules

### Build-level primary CTA

The primary CTA of the whole `Build` screen is:

- `Add module`

This action may appear in exactly two places:

- course-stage header
- continuation block at the end of the module list/workspace

This duplication is intentional because:

- one placement helps at the top of the workspace
- one placement helps after the creator scrolls through existing modules

`Add module` should not also appear in:

- the structure rail
- the inspector
- every empty subsection

## Contextual CTA Rules

### Module-level CTA

Within a module, the dominant contextual CTA is:

- `Add lesson`

Optional companion CTA:

- `Add exercise`

But `Add exercise` should usually live one level deeper, closer to a lesson context, unless the product later supports module-level loose practice units.

### Lesson-level CTA

Within a selected lesson, the contextual CTA is:

- `Add exercise`

Optional companion CTA:

- `Add checkpoint`

These actions should live:

- in the lesson card area
- or in the lesson inspector

They should not be promoted to the course header.

## Creation Flows

### Create module

Recommended v1 flow:

- creator clicks `Add module`
- a new module appears immediately in sequence
- the new module becomes selected
- the inspector opens to module details

The creator should not have to go through a heavy modal just to create an empty module.

### Create lesson

Recommended v1 flow:

- creator enters a specific module context
- clicks `Add lesson`
- a new lesson appears inside that module
- the lesson becomes selected
- the inspector opens to lesson details

This keeps lesson creation anchored to the module where it belongs.

### Create exercise

Recommended v1 flow:

- creator selects a lesson
- clicks `Add exercise`
- a new exercise appears under that lesson
- the exercise becomes selected
- the inspector or inline details area opens

### Create checkpoint

Recommended v1 flow:

- creator selects a lesson
- chooses `Add checkpoint`
- checkpoint appears in the same child-unit area as exercises

This keeps practice and validation within the same local lesson structure.

## Inline vs Inspector Rules

Recommended v1 principle:

- use inline editing for short, high-frequency edits
- use the inspector for richer, lower-frequency, or structurally sensitive edits

## Inline edits

Safe inline edits:

- module title
- lesson title
- expand/collapse
- quick add actions
- lightweight reorder controls

Inline should be fast and low-friction.

## Inspector edits

Use the inspector for:

- descriptions
- outcomes or intent
- audience-facing details
- lesson type changes
- prerequisites
- readiness warnings
- advanced settings

This keeps the workspace readable.

## What should not happen in modals by default

Avoid using modals for routine structural authoring such as:

- creating an empty module
- creating a basic lesson
- renaming a lesson

Modals are acceptable for:

- AI-assisted generation prompts
- destructive confirmations
- larger structured import flows

## Selection Model

Recommended v1 rule:

- `Build` uses single selection

This means:

- one selected course/module/lesson/exercise at a time
- selection controls the inspector contents
- selection also controls contextual actions

### Selection behavior

- clicking a module selects the module
- clicking a lesson selects the lesson
- clicking an exercise selects the exercise
- clicking empty workspace clears element selection but keeps the course context

The UI should always make the selected element obvious.

## Reordering Rules

Recommended v1 rule:

- modules reorder within the course
- lessons reorder within their parent module
- exercises and checkpoints reorder within their parent lesson

Recommended UX:

- drag-and-drop when the renderer supports it well
- explicit move up/down or move left/right controls as an acceptable temporary fallback

The rule that matters more than the mechanism:

- reordering must be local and predictable

The creator should never wonder whether an item moved inside its parent or across the whole course.

## Empty State Rules

### Empty course

When the course has no modules:

- the workspace should explain what a first module is
- the dominant action should be `Add module`
- preview should stay visible but clearly secondary

### Empty module

When a module has no lessons:

- the module body should show a clear local empty state
- the dominant action should be `Add lesson`

### Empty lesson

When a lesson has no exercises or checkpoints:

- the lesson should still be valid as a content unit
- but the UI may suggest `Add exercise` or `Add checkpoint`

The product should not imply that every lesson is broken just because it has no child practice units.

## Readiness Cues

`Build` should help the creator understand what still needs work.

Recommended v1 readiness cues:

- course has no modules
- module has no lessons
- lesson has empty title or empty description
- lesson has unresolved prerequisite problems
- course has not yet been previewed since the last major structure change

These cues should be visible as lightweight indicators in:

- the structure rail
- the inspector
- the course overview summary

They should not dominate the main workspace like error banners.

## Action Deduplication Rules

To avoid the primitive noisy UI state seen in earlier prototypes:

- do not show `Preview` on every lesson card
- do not show `Add module` in rail, header, inspector, and empty state simultaneously
- do not expose `Share`, `Settings`, or `Publish` as equal-weight neighbors of build actions
- do not give every card a full toolbar by default

Contextual actions should appear near the element they affect.

## Build vs Preview Boundary

`Build` should optimize for authoring.
It should not try to be half authoring and half learner runtime.

That means:

- `Build` may show structural progression cues
- `Build` may show readiness warnings
- `Build` should not become the main place for learner-style lesson consumption

If the creator wants to validate the learner flow, the correct next step is:

- `Preview`

## Temporary Block-Based Shell Rule

Because the real `core-canvas` may come later, the immediate block-based shell should still respect this interaction contract.

That means:

- one selected element
- one inspector
- one primary build CTA
- contextual create actions inside the correct parent context
- predictable hierarchy and reorder behavior

The temporary renderer must not invent a different interaction model just because it is not yet a real canvas.

## Decisions This Spec Resolves

- `Build` has one primary screen-level CTA: `Add module`
- lesson and exercise creation are contextual, not global
- the structure rail is for navigation and orientation, not duplicate editing
- single selection drives the inspector
- inline editing stays lightweight
- richer edits live in the inspector
- empty states and readiness cues must guide structure creation without flooding the screen with duplicate CTAs

## Recommended Next Documentation Step

After this spec, the next most useful clarification is:

- `Core-Canvas and Migration Strategy`

That document should define:

- what the dedicated learning canvas must abstract away from the planning canvas
- which interaction rules stay stable across the renderer change
- what can remain block-based temporarily
- what should never be coupled to the temporary renderer
