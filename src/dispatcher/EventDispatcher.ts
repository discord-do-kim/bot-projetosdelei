/* eslint-disable @typescript-eslint/ban-types */
import { Events } from "discord.js";
import { interactionEventHandler } from "../handlers/InteractionEventHandler";
import { EventHandler } from "../handlers/EventHandler";
import { clientReadyHandler } from "../handlers/ClientReadyHandler";

class EventDispatcher {
  public readonly listeners = new Map<Events, Set<EventHandler>>();

  public addEventListener(eventName: Events, listener: EventHandler): void {
    let listeners = this.listeners.get(eventName);

    if (listeners == null) {
      listeners = new Set();
      this.listeners.set(eventName, listeners);
    }

    listeners.add(listener);
  }

  public async dispatchEvent(eventName: Events, ...args: any[]): Promise<void> {
    const listeners = this.listeners.get(eventName);
    if (listeners != null) {
      for (const listener of listeners) {
        await listener.handle(...args);
      }
    }
  }

  get events(): Events[] {
    return Array.from(this.listeners.keys());
  }
}

export const eventDispatcher = new EventDispatcher();

eventDispatcher.addEventListener(
  Events.InteractionCreate,
  interactionEventHandler
);

eventDispatcher.addEventListener(Events.ClientReady, clientReadyHandler);
