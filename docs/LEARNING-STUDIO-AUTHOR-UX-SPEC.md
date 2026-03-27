# Learning Studio Author UX Spec

## Status

- State: decision record
- Updated: 2026-03-27
- Scope: creator-facing information architecture and interaction model
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-IMPLEMENTATION-BLUEPRINT.md`

## Why this spec exists

Implementation paused because the module had started to accumulate UI structure without a sufficiently clear author journey.

This document fixes that by defining:

- one canonical creator flow
- which screens are primary vs secondary
- where key actions live
- which CTAs should be removed or deduplicated
- whether `Learn` is a real top-level mode or a preview concept

## Decision Summary

- The creator journey is:
  - `Home`
  - `Course Overview`
  - `Build`
  - `Preview`
  - `Share / Settings / Publish`
- `Learn` should be treated as `Preview` in the creator-facing IA.
- `Preview` is a primary screen for the creator flow.
- `Access`, `Settings`, and `Publish` are secondary management surfaces.
- The product must avoid equal-weight mode buttons for everything.
- Each screen must have one primary intent and one dominant CTA.

## Core UX Principles

### 1. One primary intent per screen

The user should never feel that five unrelated actions are equally important.

### 2. Overview before management

A course should open into an orientation layer before the user is pushed into editing or admin tasks.

### 3. Build is the main work surface

Most creator time should be spent in `Build`.
This is the primary authoring screen.

### 4. Preview is for validation, not administration

`Preview` exists so the creator can verify the learner experience.
It is not the place to manage access, settings, or publication.

### 5. Management belongs in secondary surfaces

Access, settings, and publication are important, but they should not compete with authoring for attention.

### 6. CTA duplication must be intentional

The same action may appear more than once only when the repeated placement serves a different stage of scrolling or context.

## Canonical Author Journey

### 1. Home

The creator arrives in the course library.

Primary job:

- create a new course
- reopen an existing course

Expected outcome:

- choose a course to work on

### 2. Course Overview

The creator lands on a course-level orientation screen.

Primary job:

- understand what the course is
- see current structure, status, and readiness
- decide what to do next

Expected outcome:

- move to `Build`
- or move to `Preview`

### 3. Build

The creator edits the actual course structure.

Primary job:

- add modules
- add lessons and exercises
- sequence the flow
- edit metadata and prerequisites

Expected outcome:

- produce a coherent learning structure

### 4. Preview

The creator validates the learner experience.

Primary job:

- check flow clarity
- verify current step and next step
- confirm that prerequisites and lesson progression feel correct

Expected outcome:

- return to `Build` for fixes
- or continue to sharing/publishing decisions

### 5. Share / Settings / Publish

The creator manages distribution and lifecycle.

Primary job:

- grant access
- review settings
- publish or archive

Expected outcome:

- move the course from private draft toward learner use

## Primary Screens

These are first-class screens in the author flow.

### Home

- non-canvas
- course library
- empty state
- course cards

Primary CTA:

- `Create course`

Secondary CTA:

- `Create with AI`

### Course Overview

- course title
- short description
- status
- structure summary
- readiness summary
- next-step guidance

Primary CTA:

- `Build course`

Secondary CTA:

- `Preview`

Tertiary actions:

- `Share`
- `Settings`
- `Publish`

### Build

- structure outline
- main course workspace
- inspector / editing panel
- per-module lesson creation

Primary CTA:

- `Add module`

Secondary CTA:

- `Preview`

Contextual CTA:

- `Add lesson`
- `Add exercise`

### Preview

- learner-oriented structure
- focused lesson area
- progress visibility
- next recommended step

Primary CTA:

- `Start / Resume next lesson`

Secondary CTA:

- `Back to Build`

Tertiary actions:

- `Share`
- `Settings`

## Secondary Surfaces

These should not compete with the primary author flow.

### Share / Access

- invite learner
- copy share link
- review granted access

### Settings

- course metadata review
- publication state
- duplicate
- archive

### Publish

Publish is not its own top-level screen in the creator IA.

It should exist as:

- a course-header action
- or a primary action inside `Settings`

## Action Placement Rules

### `Create course`

Place only in:

- `Home` header
- `Home` empty state

Do not scatter this action across course-specific screens.

### `Open course`

Place in:

- the whole course card surface
- an optional supporting button on the card

Opening a course should default to `Overview`.

### `Build course`

Place in:

- `Overview` header
- course card secondary action on `Home`

Do not place it repeatedly inside unrelated admin surfaces.

### `Preview`

Place in:

- `Overview` header
- `Build` header

Do not place `Preview` on every lesson card.

### `Add module`

Place in:

- `Build` header
- one continuation placement at the end of the module list

Do not repeat it in multiple side panels and cards at once.

### `Add lesson` / `Add exercise`

Place only in:

- the footer/actions area of a specific module
- optional inline insertion points between lessons later

Do not make these global page-level actions.

### `Edit lesson`

Trigger via:

- clicking the lesson card
- clicking the lesson row in the outline

Editing then happens in the inspector or detail panel.

Do not use separate full-page routing for lesson edit in the local prototype.

### `Share`

Place in:

- `Overview` tertiary actions
- `Preview` tertiary actions
- course header overflow

Do not keep `Share` as an equal-weight top-level mode beside `Build`.

### `Settings`

Place in:

- course header overflow
- `Overview` tertiary actions

Do not expose it as a primary destination from `Home`.

### `Publish`

Place in:

- `Settings`
- or `Overview` tertiary actions when the course is structurally ready

Do not expose `Publish` as a persistent CTA on every screen.

## CTA Deduplication Rules

The interface should remove these anti-patterns:

- equal-weight top-level buttons for `Home / Build / Learn / Access / Settings`
- multiple `Add module` buttons visible in unrelated regions at the same time
- `Preview` repeated on every lesson card
- `Share` and `Settings` treated as peers to the core authoring flow

The interface may keep these intentional duplicates:

- `Create course` in `Home` header plus `Home` empty state
- `Add module` in `Build` header plus end-of-list continuation
- `Build course` in `Home` card plus `Overview`

## Decision: `Learn` vs `Preview`

For creator-facing IA, `Learn` should be renamed conceptually to `Preview`.

Reason:

- creators are not entering the product as learners
- the intent is to validate the learner experience
- `Preview` is clearer and matches common authoring products

Important implementation note:

- the internal route id may temporarily remain `learn`
- the user-facing label and documentation should treat it as `Preview`
- a future real learner-facing entry can still use a distinct learner runtime and wording

## Screen-Level Success Criteria

### Home is successful when:

- a new creator can immediately tell how to start
- an existing creator can reopen a course without mode confusion

### Overview is successful when:

- the creator understands course status in under a few seconds
- the next action is obvious without scanning the whole screen

### Build is successful when:

- structure editing is the dominant focus
- creation actions appear exactly where the user needs them
- admin actions do not distract from authoring

### Preview is successful when:

- the creator can validate sequencing and learner clarity quickly
- returning to `Build` is frictionless

### Share / Settings are successful when:

- they are easy to find when needed
- they do not interrupt the main creation flow

## Implications For Next Implementation Pass

Before more UI code is added:

- keep `Home`, `Overview`, `Build`, and `Preview` as the only primary author destinations
- treat `Access` and `Settings` as secondary surfaces
- reduce route-level and card-level CTA duplication
- rename creator-facing `Learn` copy to `Preview`
- align the course shell around one dominant action per screen

This spec should be treated as the reference UX contract for the next iteration.
