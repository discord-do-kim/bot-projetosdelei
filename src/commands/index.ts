/**
 * @module
 * @description
 * Starting point to import all commands.
 */
import { PingHandler } from "./PingHandler";
import { TimerHandler } from "./TimerHandler";

export default [new PingHandler(), new TimerHandler()];
