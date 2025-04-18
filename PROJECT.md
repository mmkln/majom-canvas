# Project Overview: Majom Canvas

---

## Rules for AI Assistant

- All documentation, code comments, and user-facing text must be in English.
- When updating documentation, always translate or rewrite existing sections to English if they are not already.
- Follow explicit user instructions and project conventions.
- If a rule or preference is mentioned in this section, it takes precedence over previous documentation language or style.
- If in doubt, ask for clarification or default to English for all outputs.

---

> **Fill this file with a description, vision, ideas, architecture, and plans for your application. I will take this file into account in all future sessions!**

---

## Project Overview

Majom Canvas is an interactive tool for visualizing and managing tasks, stories, and personal goals on a canvas. The main goal is to create an intuitive environment for planning and tracking progress.

## Architecture and Tech Stack

- **TypeScript** as the main programming language.
- **TailwindCSS** for UI component styling, with a custom configuration for Replit-like colors.
- **tailwind-merge** for dynamic style merging, simplifying theme and variant support.
- Modular architecture that separates data logic, rendering, and user interaction.

## Main Components and Functionality

### 1. Element Visualization
- **Tasks:**
  - Displayed as rectangles with the task text inside.
  - Card elements:
    - **Title:** Text at the top (e.g., "Develop API").
    - **Status:** Color indicator (e.g., green for completed).
    - **Action buttons:** Icons for editing and deleting (e.g., pencil and trash).
  - **Interactivity:**
    - Dragging on the canvas.
    - Editing via modal window on title or edit icon click.
    - Context menu on right click with options: "Edit", "Delete", "Add dependency".

- **Stories:**
  - Group related tasks into a single container.
  - Visualization:
    - Transparent fill with a dashed border.
    - Title displayed at the top of the container.
    - Border color reflects the story’s status (pending, in-progress, done).
    - Freely draggable and resizable on the canvas.
  - Interaction:
    - Drag to move the story along with all its tasks.
    - Drag tasks into the container to add them, or out to remove them.
    - Click to select (Shift+click for multi-selection).
    - Press Backspace to delete the selected story.
    - Edit title and border color via a modal or context menu.
    - Context menu options: Edit, Delete, Add Task to Story.
  - Connections:
    - Stories and tasks can be connected (excluding tasks already contained in the story).

- **Goals:**
  - Represent larger personal goals to which tasks and stories can be linked.
  - Visualization:
    - **Format:** Separate cards or badges, visually distinct from tasks and stories.
    - **Card elements:**
      - **Title:** Text at the top (e.g., "Launch MVP").
      - **Progress indicator:** Bar or percentage showing completion status.
      - **Number of linked tasks:** Number or icon indicating how many tasks are linked to the goal.
      - **Action buttons:** Icons for editing and deleting. (can be skipped for now)
    - **Placement:** Can be placed anywhere on the canvas.
  - **Interactivity:**
    - Dragging on the canvas.
    - Update progress via linked tasks.
    - Edit via modal window.
    - Connect to tasks and stories.
    - Context menu with options: "Edit", "Delete", "Link task". (can be skipped for now)

- **Connections:**
  - Visualization of dependencies between tasks as arrows.
  - **Format:**
    - Straight or curved lines between tasks.
    - Color coding for different types of dependencies (e.g., red for blockers).
  - **Interactivity:**
    - Create connections by dragging from one task to another.
    - Delete connections via context menu on the line.

### 2. Canvas Interaction and Tools
- **Canvas Interaction Buttons:**
  - Located in the bottom right corner.
  - Functionality:
    - **Zoom In (+):** Increase canvas scale.
    - **Zoom Out (-):** Decrease canvas scale.
    - **Center Canvas:** Center the canvas and reset scale to default.

- **Toolbar Buttons:**
  - Located at the top center.
  - Functionality:
    - **Select:** Change cursor type for selecting elements.
    - **Create Task:** Create a new task.
    - **Create Story:** Create a new story.
    - **Create Goal:** Create a new goal.

### 3. Authentication and Backend Integration
- **Authentication in majom-wrapper:**
  - **Technical requirements:**
    - Request auth and refresh tokens from the backend.
    - Store tokens in local storage for use in backend requests.
  - **UI Requirements:**
    - Show a round avatar in the top right corner for logged-in users. Clicking the avatar opens a dropdown user menu with Login and Logout buttons.
    - For non-logged-in users, show a Login button in the same place.
    - Clicking the Login button opens a modal window with a message, Username and Password fields, and a Login button.
    - When clicking Login in the modal, show a loading state. If login fails, display an error message below the form. If successful, close the modal and update canvas data.

### 4. Authentication & User (Update)

- **AuthService**:
  - Uses the response structure `{ access, refresh }` for authentication tokens:
    ```typescript
    export interface AuthResponse {
      access: string;
      refresh: string;
    }
    ```
  - Adds a `getUser()` method to retrieve the current user's data from `/user/`:
    ```typescript
    async getUser(): Promise<User> { /* ... */ }
    ```
  - User interface:
    ```typescript
    export interface User {
      id: number;
      email: string;
      username: string;
      language: string;
      readonly wallpaper: Wallpaper;
      wallpaper_id: string;
      readonly deletion_requested_at: string | null;
    }
    ```
    (Define the `Wallpaper` interface according to your backend)
- All authentication logic now uses the `access` and `refresh` fields from the backend response.

## Current Implementation Status & Roadmap

### Реалізовані Фічі
- **Toolbar**: Реалізовані кнопки для створення фігур (Circle, Octagon, Square) та вибору задач.
- **Canvas Manager**: Обробляє взаємодію з канвасом, включаючи масштабування та панорамування.
- **Interaction Manager**: Керує подіями миші для перетягування фігур та створення зв'язків.
- **PanZoom Manager**: Керує рівнем масштабу та позицією прокрутки канвасу.

## Важливі Нотатки
(Будь-які особливості, які треба памʼятати)

---

*Цей файл слугує головною документацією для вас і для мене як AI-асистента. Ви можете редагувати його у будь-який момент!*
