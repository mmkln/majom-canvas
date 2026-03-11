export type EventMap = Record<string, unknown>;

type Listener<TPayload> = (payload: TPayload) => void;

/**
 * Lightweight strongly-typed pub/sub bus.
 */
export class TypedEventBus<TEvents extends EventMap> {
  private listeners = new Map<
    keyof TEvents,
    Set<Listener<TEvents[keyof TEvents]>>
  >();

  /**
   * Subscribes to an event and returns an unsubscribe callback.
   */
  public on<TKey extends keyof TEvents>(
    event: TKey,
    listener: Listener<TEvents[TKey]>
  ): () => void {
    let bucket = this.listeners.get(event);
    if (!bucket) {
      bucket = new Set<Listener<TEvents[keyof TEvents]>>();
      this.listeners.set(event, bucket);
    }
    bucket.add(listener as Listener<TEvents[keyof TEvents]>);
    return () => this.off(event, listener);
  }

  /**
   * Removes a previously registered event listener.
   */
  public off<TKey extends keyof TEvents>(
    event: TKey,
    listener: Listener<TEvents[TKey]>
  ): void {
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    bucket.delete(listener as Listener<TEvents[keyof TEvents]>);
    if (bucket.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Publishes a payload to all listeners registered for the event.
   */
  public emit<TKey extends keyof TEvents>(
    event: TKey,
    payload: TEvents[TKey]
  ): void {
    const bucket = this.listeners.get(event);
    if (!bucket || bucket.size === 0) return;
    const snapshot = Array.from(bucket);
    snapshot.forEach((listener) => {
      (listener as Listener<TEvents[TKey]>)(payload);
    });
  }

  /**
   * Removes all listeners for all events.
   */
  public clear(): void {
    this.listeners.clear();
  }
}
