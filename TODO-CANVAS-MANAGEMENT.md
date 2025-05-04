# Canvas Management TODO and Architecture Improvements

## 🎯 Primary Scenarios

### Scenario 1: Creating Canvas Before Authentication
- [ ] Implement temporary canvas state storage
- [ ] Create mechanism for preserving user-created elements before login
- [ ] Design bulk creation API for elements

**Implementation Details:**
- Offline user actions are stored via `LocalStorageDataProvider` and `DiagramRepository`.
- `SaveButton` dispatches `saveCanvasLayout`; subscriber needed in `UIManager`.
- Convert offline state to `CanvasPositionDTO` and call server API.
- On success: clear offline storage & notify via `NotificationService`.

**Tasks for Scenario 1:**
- [ ] Subscribe to `saveCanvasLayout` event in `UIManager` for save flow.
- [ ] Add methods to `CanvasApiService`:
  - `createCanvas(): Observable<{ id: string }>`
  - `bulkCreateElements(canvasId: string, elements: CanvasPositionDTO[]): Observable<void>`
- [ ] Extend `CanvasDataService` with `saveScenario1()` to:
  - Gather elements/positions from `scene` or `DiagramRepository`.
  - Call `createCanvas()` if needed.
  - Call `bulkCreateElements()` with DTOs.
- [ ] Handl# Canvas Management TODO and Architecture Improvements

## 🎯 Primary Scenarios

### Scenario 1: Creating Canvas Before Authentication
- [ ] Implement temporary canvas state storage
- [ ] Create mechanism for preserving user-created elements before login
- [ ] Design bulk creation API for elements

**Implementation Details:**
- Offline user actions are stored via `LocalStorageDataProvider` and `DiagramRepository`.
- `SaveButton` dispatches `saveCanvasLayout`; subscriber needed in `UIManager`.
- Convert offline state to `CanvasPositionDTO` and call server API.
- On success: clear offline storage & notify via `NotificationService`.

**Tasks for Scenario 1:**
- [ ] Extend `CanvasApiService`:
  - `createCanvas(): Observable<{ id: string }>`
  - `bulkCreateElements(canvasId: string, elements: CanvasPositionDTO[]): Observable<void>`
- [ ] Create `CanvasSyncService`:
  - Inject `DiagramRepository`, `CanvasApiService`, `NotificationService`
  - Implement `synchronizeOfflineCanvas(): Promise<void>` that:
    - Loads offline elements
    - Invokes `createCanvas()` if no canvas exists
    - Calls `bulkCreateElements(canvasId, dtos)`
    - On success: clears offline storage and notifies
    - On error: retries or shows error notification
- [ ] Subscribe to `saveCanvasLayout` event in `UIManager`:
  - Disable `SaveButton` during sync
  - Call `CanvasSyncService.synchronizeOfflineCanvas()`
- [ ] Update `SaveButton` component to show loading state and prevent duplicate clicks
- [ ] On successful sync: clear offline storage via `DiagramRepository` and dispatch success notification
- [ ] On failure: show retry option and error notification

### Scenario 2: Canvas Management After Authentication
- [ ] Develop canvas initialization strategy
- [ ] Create element placement algorithm
- [ ] Implement duplicate prevention mechanism

## 🏗️ Architectural Improvements

### 1. Temporary Canvas Storage
- Requirements:
  - Store elements created before authentication
  - Support multiple element types (Task, Story, Goal)
  - Provide methods for adding, removing, and clearing elements
  - Validate element uniqueness

```typescript
interface TemporaryCanvasStorageStrategy {
  addElement(element: BaseElement): boolean;
  removeElement(elementId: string): void;
  getElements(): BaseElement[];
  clearElements(): void;
  validateUniqueness(element: BaseElement): boolean;
}
```

### 2. Canvas Creation Strategy
- [ ] Create `CanvasCreationService`
- [ ] Implement methods:
  - `createNewCanvas()`
  - `addElementsToCanvas(elements: BaseElement[])`
  - `updateExistingCanvas(newElements: BaseElement[])`

### 3. Element Placement Algorithm
- Requirements:
  - Automatically place elements without overlap
  - Support different element types
  - Consider canvas boundaries
  - Allow manual positioning override

```typescript
interface ElementPlacementStrategy {
  findAvailablePosition(
    existingElements: BaseElement[], 
    newElement: BaseElement
  ): Position;
}
```

### 4. Duplicate Prevention
- [ ] Implement unique identifier generation
- [ ] Create comparison strategy for elements
- [ ] Add validation before element creation/addition

## 🔍 API Enhancements

### CanvasApiService Improvements
- [ ] Add `createCanvas()` method
- [ ] Implement batch element creation
- [ ] Support partial canvas updates

### AuthService Integration
- [ ] Add method to handle first-time user canvas initialization
- [ ] Create user preference for canvas creation strategy

## 🚨 Edge Cases to Handle
- Handling network interruptions during canvas creation
- Managing large number of elements
- Supporting undo/redo for canvas modifications
- Preserving element relationships

## 🧪 Testing Strategies
- Unit tests for placement algorithms
- Integration tests for canvas creation flow
- Performance tests for bulk element handling
- Edge case scenario simulations

## 🔮 Future Considerations
- Support for canvas templates
- Advanced element grouping
- Collaborative canvas editing
- Export/Import canvas functionality

## 📋 Implementation Priority
1. Temporary storage mechanism
2. Duplicate prevention
3. Placement algorithm
4. API enhancement
5. Authentication integration

## 💡 Technical Debt Notes
- Minimize direct DOM manipulations
- Use RxJS for reactive canvas management
- Implement comprehensive logging
- Create clear error handling strategies
e success/failure:
  - On success: clear localStorage via `DiagramRepository`, dispatch notification.
  - On error: show retry via `NotificationService`.
- [ ] Disable `SaveButton` while save in progress.

### Scenario 2: Canvas Management After Authentication
- [ ] Develop canvas initialization strategy
- [ ] Create element placement algorithm
- [ ] Implement duplicate prevention mechanism

## 🏗️ Architectural Improvements

### 1. Temporary Canvas Storage
- Requirements:
  - Store elements created before authentication
  - Support multiple element types (Task, Story, Goal)
  - Provide methods for adding, removing, and clearing elements
  - Validate element uniqueness

```typescript
interface TemporaryCanvasStorageStrategy {
  addElement(element: BaseElement): boolean;
  removeElement(elementId: string): void;
  getElements(): BaseElement[];
  clearElements(): void;
  validateUniqueness(element: BaseElement): boolean;
}
```

### 2. Canvas Creation Strategy
- [ ] Create `CanvasCreationService`
- [ ] Implement methods:
  - `createNewCanvas()`
  - `addElementsToCanvas(elements: BaseElement[])`
  - `updateExistingCanvas(newElements: BaseElement[])`

### 3. Element Placement Algorithm
- Requirements:
  - Automatically place elements without overlap
  - Support different element types
  - Consider canvas boundaries
  - Allow manual positioning override

```typescript
interface ElementPlacementStrategy {
  findAvailablePosition(
    existingElements: BaseElement[], 
    newElement: BaseElement
  ): Position;
}
```

### 4. Duplicate Prevention
- [ ] Implement unique identifier generation
- [ ] Create comparison strategy for elements
- [ ] Add validation before element creation/addition

## 🔍 API Enhancements

### CanvasApiService Improvements
- [ ] Add `createCanvas()` method
- [ ] Implement batch element creation
- [ ] Support partial canvas updates

### AuthService Integration
- [ ] Add method to handle first-time user canvas initialization
- [ ] Create user preference for canvas creation strategy

## 🚨 Edge Cases to Handle
- Handling network interruptions during canvas creation
- Managing large number of elements
- Supporting undo/redo for canvas modifications
- Preserving element relationships

## 🧪 Testing Strategies
- Unit tests for placement algorithms
- Integration tests for canvas creation flow
- Performance tests for bulk element handling
- Edge case scenario simulations

## 🔮 Future Considerations
- Support for canvas templates
- Advanced element grouping
- Collaborative canvas editing
- Export/Import canvas functionality

## 📋 Implementation Priority
1. Temporary storage mechanism
2. Duplicate prevention
3. Placement algorithm
4. API enhancement
5. Authentication integration

## 💡 Technical Debt Notes
- Minimize direct DOM manipulations
- Use RxJS for reactive canvas management
- Implement comprehensive logging
- Create clear error handling strategies
