# Majom Canvas

Majom Canvas is a personal development application built around two connected pillars:

- planning and time management across strategic, tactical, and operational levels
- learning and course progression integrated into the same work system

The product direction is intentionally unified for now.
Planning and learning are treated as two parts of the same personal-development workflow, even if they may become separate products in the future.

At the application level, this means learning should not live in an isolated silo.
Lessons, exercises, and other learning units should be able to appear as actionable work items alongside the rest of a user's tasks.

Technically, the app is currently an interactive TypeScript workspace for visualizing and managing tasks, user stories, goals, and related workflows on a drag-and-drop canvas.
It also unifies API interactions with automatic JWT authentication, global error handling, and layout caching.

## Key Features

- **Automatic Authentication**: `HttpInterceptorClient` attaches JWT tokens to all requests and handles errors globally.
- **Modular API Services**: CRUD operations via `TasksApiService`, `StoriesApiService`, `GoalsApiService`, and `CanvasApiService`.
- **Canvas Data Management**: `CanvasDataService` loads and maps backend DTOs into front-end elements, with RxJS caching (`retry`, `shareReplay`).
- **Flexible Mappers**: Convert backend DTOs into `TaskElement`, `StoryElement`, and `GoalElement` with position metadata.
- **Element Palette**: Searchable menu for Tasks, Stories, and Goals. Drag items onto the canvas to instantiate new elements at the drop location.
- **Unsaved Changes Indicator**: A Save button appears in the top-right when layout changes are unsaved; clicking it persists the canvas layout to the backend.
- **Clean Architecture**: Separation of data access, mapping, business logic, and UI rendering layers.

## Product Direction

### 1. Planning And Time Management

- Track personal work in one place across strategic, tactical, and operational levels.
- Connect long-term goals to execution-level tasks.
- Give users a shared workspace for planning, prioritization, and execution.

### 2. Learning As Part Of Execution

- Support courses, lessons, and guided learning flows.
- Integrate learning progress into the same work system as normal tasks.
- Treat a lesson or exercise as something that can become a concrete item to complete, not only static content to read.

### 3. Platform Strategy

- Some work items will eventually be coordinated here but executed through external services or external agents.
- That integration strategy is platform-level, not module-specific.
- See `docs/PLATFORM-INTEGRATIONS.md` for the current integration direction.

### 4. Personal Development

- The current product thesis is that planning and learning belong together because both serve personal development.
- This shared thesis is more important than forcing the app into a single traditional category such as planner, LMS, or canvas tool.
- Possible long-term strategic paths are tracked separately in `docs/STRATEGIC-DIRECTIONS.md`.
- Personalization architecture and phased delivery for the Personal Development OS direction are documented in `docs/PERSONAL-DEVELOPMENT-OS-PERSONALIZATION.md`.
- Canvas sharing and template-clone direction is tracked in `docs/CANVAS-SHARING-TEMPLATES.md`.

## Architecture & Tech Stack

- **Language**: TypeScript
- **Reactive Programming**: RxJS (`forkJoin`, `map`, `retry`, `shareReplay`)
- **HTTP Client**: `rxjs-http-client` wrapped by `HttpInterceptorClient`
- **Bundler**: Vite
- **Styling**: TailwindCSS (with `tailwind-merge` for dynamic theming)
- **Module Resolution**: ES modules with explicit `.ts`/`.js` extensions
- **Backend**: Django REST Framework with JWT authentication

## Getting Started

### Prerequisites

- Node.js >=14
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo_url>
cd majom-canvas

# Install dependencies
npm install
```

### Configuration

1. In your browser or application, store your JWT in Local Storage:
   ```js
   localStorage.setItem('jwt_token', '<your_jwt_token>');
   ```
2. (Optional) Set `VITE_API_BASE_URL` in `.env` for custom API host.

### Development Server

```bash
npm run dev
```

## Usage Example

```ts
import { HttpInterceptorClient } from './src/majom-wrapper/data-access/http-interceptor.js';
import { TasksApiService, StoriesApiService, GoalsApiService, CanvasApiService, CanvasDataService } from './src/majom-wrapper';

// Initialize HTTP client with optional baseUrl
const http = new HttpInterceptorClient(import.meta.env.VITE_API_BASE_URL || '');

// Create data service
const canvasData = new CanvasDataService(
  new TasksApiService(http),
  new StoriesApiService(http),
  new GoalsApiService(http),
  new CanvasApiService(http)
);

// Load and render canvas elements
canvasData.loadElements().subscribe(elements => {
  // Render elements on your canvas
});

// Persist layout changes
canvasData.updateLayoutBatch(changes).subscribe();
```

## Testing

- **Unit Tests**: Add and run tests for `HttpInterceptorClient`, mappers, and API services.
- Run all tests:
  ```bash
  npm test
  ```
- Lint and format:
  ```bash
  npm run lint
  npm run format
  ```

## Roadmap

1. **Alpha**: Core CRUD, drag-and-drop, layout persistence via REST.
2. **Beta**: Real-time collaboration with WebSockets; mobile-responsive UI; OAuth support.
3. **v1.0**: Advanced editing tools (align, group move); plugin architecture; internationalization.
4. **Future**: Analytics dashboard; third-party integrations (e.g., Jira, Trello); shared canvas permissions.

---

_For more details, explore code comments and inline documentation in the `src/majom-wrapper` directory._
