type EventCallback = (payload?: any) => void;

class EventBus {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback) {
    this.events[event] = this.events[event]?.filter(cb => cb !== callback);
  }

  emit(event: string, payload?: any) {
    this.events[event]?.forEach(callback => callback(payload));
  }
}

export const eventBus = new EventBus();
