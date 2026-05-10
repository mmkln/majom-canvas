# UI-Lib

## Global Notifications

- Treat `NotificationService.notify(...)` and `notifications$` as the shared app notification bus.
- Mount exactly one `ToastProvider` at the app/runtime shell level, not inside a feature module.
- Feature modules should emit translated, user-facing messages through `notify(message, tone)` and should not create their own persistent notification container for the same bus.
- Keep contextual form validation near the form, but route page-level save/load failures through the global toast provider.
