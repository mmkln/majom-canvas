# Canvas Management TODO and Architecture Improvements

## 🎯 Primary Scenarios

### Scenario 1: Creating Canvas Before Authentication
- [ ] Implement temporary canvas state storage
- [ ] Create mechanism for preserving user-created elements before login
- [ ] Design offline→online synchronization flow

**Implementation Details:**
- Temporary actions stored in `OfflineCanvasService`.
- Retrieve buffered elements via `OfflineCanvasService.getElements()`.
- For each element type (Task/Story/Goal): map to DTO and create on server via respective API.
- Create or get canvas with `CanvasApiService.createCanvas()`.
- Batch create positions via `CanvasApiService.bulkCreatePositions()`.
- On success: clear buffer using `OfflineCanvasService.clearElements()` and notify via `notify()`.
- On failure: retry or show error notification.

**Tasks for Scenario 1:**
- [ ] Create `OfflineCanvasService` with methods: `addElement()`, `removeElement()`, `getElements()`, `clearElements()`, `validateUniqueness()`.
- [ ] Refactor `CanvasSyncService` to use `OfflineCanvasService` instead of `DiagramRepository`.
- [ ] Subscribe sync event in `UIManager` to disable/enable `SaveButton`.
- [ ] Update `SaveButton` component to show loading and prevent duplicate submissions.
- [ ] Add unit/integration tests for offline→online sync flow.

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
