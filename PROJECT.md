# Majom Canvas

Majom Canvas is an interactive TypeScript application for visualizing and managing tasks, user stories, and personal goals on a drag-and-drop canvas. It unifies API interactions with automatic JWT authentication, global error handling, and layout caching.

## Key Features

- **Automatic Authentication**: `HttpInterceptorClient` attaches JWT tokens to all requests and handles errors globally.
- **Modular API Services**: CRUD operations via `TasksApiService`, `StoriesApiService`, `GoalsApiService`, and `CanvasApiService`.
- **Canvas Data Management**: `CanvasDataService` loads and maps backend DTOs into front-end elements, with RxJS caching (`retry`, `shareReplay`).
- **Flexible Mappers**: Convert backend DTOs into `TaskElement`, `StoryElement`, and `GoalElement` with position metadata.
- **Element Palette**: Searchable menu for Tasks, Stories, and Goals. Drag items onto the canvas to instantiate new elements at the drop location.
- **Unsaved Changes Indicator**: A Save button appears in the top-right when layout changes are unsaved; clicking it persists the canvas layout to the backend.
- **Clean Architecture**: Separation of data access, mapping, business logic, and UI rendering layers.

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
