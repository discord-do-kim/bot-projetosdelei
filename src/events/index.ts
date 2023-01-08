import { ClientReadyEvent } from "./ClientReadyEvent";
import { InteractionCreateEvent } from "./InteractionCreateEvent";
/**
 * @module
 * @description
 * Starting point to import all event handlers.
 */
const events = [new InteractionCreateEvent(), new ClientReadyEvent()];

export default events;
