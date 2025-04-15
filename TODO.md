# TODO

## Загальні задачі
- [ ] Оновити/додати README з описом функціоналу, запуску, структури коду
- [ ] Додати/оновити документацію для всіх основних класів та інтерфейсів
- [ ] (SKIP FOR NOW) Додати юніт-тести для ключових класів (InteractionManager, Shape, Connection, Octagon)
- [ ] (SKIP FOR NOW) Додати інтеграційні тести для основних сценаріїв роботи
- [ ] Перевірити типізацію TypeScript по всьому проекту
- [ ] (SKIP FOR NOW) Налаштувати CI для автоматичної перевірки тестів і лінтингу
- [ ] Перевести всі коментарі, документацію та тексти інтерфейсу англійською мовою

## Основна функціональність canvas (з PROJECT.md)
### Tasks (Задачі)
- [ ] Display tasks as rectangles with title, status, and action buttons
- [ ] Implement drag-and-drop for tasks on the canvas
- [ ] Edit tasks via modal window (on title or edit icon click)
- [ ] Add context menu for tasks: Edit, Delete, Add dependency

### Stories
- [ ] Develop a container for grouping tasks as a story
- [ ] Add the ability to customize the border color and story title
- [ ] Implement dragging and resizing of the container
- [ ] Add a context menu for editing and adding tasks to a story

### Goals
- [ ] Create a class/component for goals as cards or badges
- [ ] Add progress tracking via linked tasks
- [ ] Implement interactivity (drag, edit, context menu)
- [ ] Integrate goals with other canvas elements (e.g. connections with tasks)

### Connections
- [ ] Complete implementation of creating connections between tasks via drag-and-drop
- [ ] Add ability to delete connections via context menu
- [ ] Implement color coding for different dependency types (e.g. red for blockers)
- [ ] Visualize dependencies as arrows (straight/curved lines)

### Canvas Interaction & Toolbar
- [ ] Create UI components for Zoom In, Zoom Out, Center Canvas (bottom right)
- [ ] Connect zoom functionality to Zoom In/Out buttons
- [ ] Implement centering of the canvas
- [ ] Add toolbar buttons: Select, Create Task, Create Story, Create Goal (top center)
- [ ] Implement functionality for each toolbar button

### Authentication & User
- [ ] Implement UI for avatar/Login button in top right
- [ ] Create dropdown menu for logged-in users (Login/Logout)
- [ ] Modal window for login with Username/Password fields, loading state, error handling
- [ ] Integrate backend requests for tokens, store tokens in localStorage
- [ ] Update canvas data after successful login
- [ ] Implement AuthService with access/refresh tokens and getUser method
- [ ] Define User and Wallpaper interfaces according to backend

## Архітектурний рефакторинг (Zoom/Canvas Controls)
- [x] Перенести zoomIn, zoomOut, centerCanvas у PanZoomManager
- [x] Додати подієву систему onZoomChange у PanZoomManager
- [x] Зробити ZoomIndicator реактивним через підписку на зміну масштабу
- [x] CanvasManager делегує управління зумом/центруванням у PanZoomManager
- [ ] (Опціонально) Винести wheel/mouse події в окремий менеджер
- [ ] (Опціонально) Ввести UIManager для монтування UI-компонентів

## InteractionManager
- [ ] Рефакторинг: розбити великий клас на менші сервіси/менеджери (наприклад, DragManager, ConnectionManager)
- [ ] Додати обробку подвійного кліку, правого кліку, drag&drop для різних типів фігур
- [ ] Винести логіку роботи з tempConnectionLine в окремий сервіс
- [ ] Додати debounce/throttle для обробки подій миші
- [ ] Покращити логування та обробку помилок
- [ ] Додати можливість відміни дій (undo/redo)

## Shape та Octagon
- [ ] Винести спільну логіку Shape в утиліти/абстракції
- [ ] Додати підтримку інших типів фігур (наприклад, прямокутник, ромб, трикутник)
- [ ] Додати можливість кастомізації кольорів/розмірів фігур через UI
- [ ] Покращити алгоритм визначення contains для складних фігур
- [ ] Додати unit-тести для getBoundaryPoint, getConnectionPoints

## Connection
- [ ] Додати підтримку різних типів ліній (прямі, криві Безьє, ламані)
- [ ] Додати drag&drop для редагування ліній зв'язку
- [ ] Додати можливість видалення зв'язків через UI
- [ ] Покращити візуалізацію виділених зв'язків
- [ ] Додати unit-тести для getClosestConnectionPoints, drawLine

## Інтерфейси та типи
- [ ] Перевірити відповідність реалізацій інтерфейсам
- [ ] Додати/уточнити JSDoc для всіх інтерфейсів
- [ ] Уніфікувати імена типів і полів

## UI та UX
- [ ] Додати тултіп/хінти при наведенні на точки з'єднання
- [ ] Додати анімацію при створенні/видаленні фігур і зв'язків
- [ ] Додати гарячі клавіші для основних дій (видалення, копіювання, відміна)
- [ ] Зробити UI для налаштувань фігур і зв'язків

## Інше
- [ ] Провести аудит безпеки (наприклад, захист від XSS, якщо є текстові поля)
- [ ] Оновити залежності (npm audit)
- [ ] Оновити .gitignore за потреби

---
Кожну задачу можна розбити ще дрібніше у процесі роботи. Якщо потрібна деталізація по конкретному пункту — звертайся!
