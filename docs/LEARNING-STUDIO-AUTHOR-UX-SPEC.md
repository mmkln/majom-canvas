# Learning Studio Author UX Spec

## Status

- State: decision record
- Updated: 2026-03-28
- Scope: creator-facing information architecture after the strategy reset
- Related docs:
  - `docs/LEARNING-STUDIO.md`
  - `docs/LEARNING-STUDIO-STRATEGY-RESET.md`
  - `docs/LEARNING-STUDIO-BUILD-INTERACTION-SPEC.md`
  - `docs/LEARNING-STUDIO-PREVIEW-LEARNER-RUNTIME-SPEC.md`

## Why this spec exists

The old author direction treated canvas authoring as the main work surface.
That no longer reflects the product strategy.

This document defines the new creator-facing model:

- authoring is structured
- preview is learner-oriented
- the canvas belongs primarily to preview/runtime, not to the core creation flow

## Decision Summary

- The creator journey is:
  - `Home`
  - `Course Overview`
  - `Build`
  - `Preview`
  - `Share / Settings / Publish`
- `Build` is the primary authoring screen.
- `Build` is a structured builder, not a freeform canvas editor.
- `Preview` is the creator-facing validation screen.
- `Preview` may prominently use the interactive course map.
- `Access`, `Settings`, and `Publish` remain secondary management surfaces.
- Each screen must keep one primary intent and one dominant CTA.

## Core UX Principles

### 1. One job per screen

The creator should always know what this screen is for right now.

### 2. Authoring and navigation are different jobs

Creating the course and navigating the course are not the same activity.
The product should not force them into one surface.

### 3. Build is for structure and editing

`Build` should optimize for:

- order
- hierarchy
- repeated creation
- fast edits

### 4. Preview is for learner validation

`Preview` should optimize for:

- learner clarity
- path understanding
- progression logic
- map-based orientation where useful

### 5. Management stays secondary

Access, settings, and publication should not compete with authoring or validation.

## Canonical Author Journey

### 1. Home

The creator opens the course library.

Primary job:

- create a new course
- reopen an existing course

### 2. Course Overview

The creator sees orientation and current course state.

Primary job:

- understand what the course is
- understand whether it needs more authoring or is ready for validation
- move to the next meaningful screen

### 3. Build

The creator edits the actual course structure and content.

Primary job:

- create modules
- create lessons
- create exercises and checkpoints
- reorder items
- edit details

This is the main authoring surface.

### 4. Preview

The creator validates the learner experience.

Primary job:

- see the course as a learner would
- understand map flow and next-step clarity
- verify prerequisites and path logic
- return to build with clear context

### 5. Share / Settings / Publish

The creator manages distribution and lifecycle.

Primary job:

- grant access
- review settings
- publish or archive

## Primary Screens

### Home

- non-canvas
- course library
- empty state
- course cards

Primary CTA:

- `Create course`

### Course Overview

- title
- short description
- state summary
- structure summary
- next-step recommendation

Primary CTA:

- `Continue building`

Secondary CTA:

- `Preview`

### Build

- structured outline/tree/list of the course
- focused creation controls
- selected-item editing entry
- details modal or other dense edit surface

Primary CTA:

- `Add module`

Contextual CTAs:

- `Add lesson`
- `Add exercise`
- `Add checkpoint`
- `Edit`

### Preview

- learner-oriented shell
- interactive course map when that map improves understanding
- focused lesson/unit presentation
- progression and availability cues

Primary CTA:

- `Start / Resume next step`

Secondary CTA:

- `Back to Build`

## Core Screen Rules

### Build

`Build` should not depend on:

- spatial canvas editing
- drag-to-connect for the main creation path
- freeform node placement as the source of truth

`Build` should depend on:

- explicit hierarchy
- deterministic order
- predictable creation flows
- easy repeated edits

### Preview

`Preview` should not become:

- a second editor
- a management screen
- a fake learner impersonation flow with real side effects

`Preview` should become:

- the creator-facing validation version of learner navigation

## Learn vs Preview

For creator-facing IA:

- use `Preview`

Do not frame the creator as a learner inside the author workspace.
The creator is validating the learner experience, not entering the product as a learner.

## What the canvas is now allowed to mean

Inside the creator flow, the canvas is allowed to mean:

- course map
- path map
- prerequisite map
- learner-facing structure map in preview

It is no longer the default meaning of:

- main authoring editor

## Success Criteria

### Build is successful when:

- creators can add and reorder structure quickly
- dense editing does not require spatial manipulation
- repeated course construction feels fast

### Preview is successful when:

- creators can understand the learner path quickly
- the map clarifies branching and prerequisites
- returning to `Build` is frictionless

## Final Rule

Keep `Home`, `Overview`, `Build`, and `Preview` as the only primary creator destinations.

Within that model:

- `Build = structured authoring`
- `Preview = learner-oriented map and validation`
