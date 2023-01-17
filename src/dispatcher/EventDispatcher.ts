/* eslint-disable @typescript-eslint/ban-types */
import { Events } from "discord.js";
import { interactionEventHandler } from "../handlers/InteractionEventHandler";
import { EventHandler } from "../handlers/EventHandler";
import { clientReadyHandler } from "../handlers/ClientReadyHandler";

class EventDispatcher {
  public readonly listeners = new Map<Events, Set<EventHandler>>();

  public addEventListener(eventName: Events, listener: EventHandler) {
    let listeners = this.listeners.get(eventName);

    if (!listeners) {
      listeners = new Set();
      this.listeners.set(eventName, listeners);
    }

    listeners.add(listener);
  }

  public dispatchEvent(eventName: Events, ...args: any[]): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      for (const listener of listeners) {
        listener.handle(...args);
      }
    }
  }

  get events() {
    return Array.from(this.listeners.keys());
  }
}

export const eventDispatcher = new EventDispatcher();

eventDispatcher.addEventListener(
  Events.InteractionCreate,
  interactionEventHandler
);

eventDispatcher.addEventListener(Events.ClientReady, clientReadyHandler);
