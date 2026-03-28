# Learning Studio Build Interaction Spec

## Status

- State: decision record
- Updated: 2026-03-28
- Scope: creator-facing interaction contract for the `Build` screen after the strategy reset
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-STRATEGY-RESET.md`
  - `docs/LEARNING-STUDIO-AUTHOR-UX-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Why this spec exists

The old build direction assumed a canvas-first authoring workspace.
That is no longer the target product model.

This document defines the new rule:

- `Build` is a structured builder

## Core Decision

Recommended v1 rule:

- `Build` is an outline-first, hierarchy-first authoring workspace

It is not:

- a freeform canvas board
- a graph editor
- a drag-to-connect authoring surface

## Primary Job of Build

The creator uses `Build` to:

- create modules
- create lessons
- create exercises and checkpoints
- keep order clear
- edit structure quickly
- open focused editing surfaces for dense changes

The screen should optimize for speed and predictability, not spatial exploration.

## Recommended Build Layout

### 1. Stage header

The top header should contain:

- course title
- stage label `Build`
- primary CTA `Add module`
- secondary CTA `Preview`

The header should not contain:

- lesson-only or exercise-only actions
- repeated contextual actions that belong inside the structure

### 2. Structure workspace

The main workspace should show a structured hierarchy:

- module rows or containers
- lesson rows nested inside modules
- exercise/checkpoint rows nested inside lessons

The structure should read immediately as:

`Module -> Lesson -> Exercise / Checkpoint`

### 3. Focused editing surface

Dense edits should open in:

- a modal
- or another focused editing surface outside the main list rhythm

The structure area should stay optimized for:

- creation
- ordering
- navigation
- selection

Not for:

- full dense content editing inline everywhere

## Interaction Rules

### Primary creation flow

The creation path should be explicit and deterministic:

1. `Add module`
2. inside a module, `Add lesson`
3. inside a lesson, `Add exercise` or `Add checkpoint`

The creator should not need to discover creation through:

- right click only
- hidden menus only
- canvas gestures only

### Reordering

Reordering should be optimized for hierarchy and sequence:

- move modules among modules
- move lessons inside their module
- move child units inside their lesson

Reordering should preserve structural ownership.

### Editing

Single click should mean:

- select

`Edit` should be explicit and visible from the selected context.

Double click may still exist as a shortcut, but it must not be the only discoverable edit path.

## Visual Model of Build

The structure should feel like a course builder, not like a generic page of forms.

Recommended visual language:

- strong top-level module containers or rows
- clear lesson rows as the main authoring unit
- lighter child rows for exercise/checkpoint
- stable spacing that communicates hierarchy before decoration does

The creator should be able to scan:

- what exists
- what belongs to what
- what is missing next

## What does not belong in Build anymore

The following should not be the primary authoring strategy:

- freeform spatial node placement
- drag-to-connect prerequisites as the normal path
- visible connection ports
- map-first structural editing

The canvas may still appear in the product, but not as the core mechanism of `Build`.

## Build vs Preview Boundary

### Build

Build answers:

- what is the structure
- what is missing
- what needs to be edited

### Preview

Preview answers:

- how does the course feel to a learner
- what path is available
- what is blocked
- what should happen next

## Implication for prerequisites

Prerequisites are domain-level rules.
In `Build`, they should be edited through focused controls, not through primary graph gestures.

That means:

- prerequisite editing is a secondary action
- prerequisite visualization is more important in `Preview` and learner runtime than in primary authoring

## Minimum v1 Build Requirements

`Build` is good enough for v1 when:

1. A creator can add and reorder modules, lessons, exercises, and checkpoints quickly.
2. The hierarchy is obvious without spatial interpretation.
3. Editing details is one click away from the selected context.
4. The creator can move to `Preview` without feeling they just left the real work surface.

## Final Rule

Treat `Build` as a structured builder.
Do not keep investing in canvas-first authoring patterns there.
