import { Events } from "discord.js";

export interface EventHandler {
  readonly eventType: Events | string;
  readonly listenerType: "on" | "once";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleEvent(...args: unknown[]): Promise<unknown>;
}
