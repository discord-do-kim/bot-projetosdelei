export abstract class ErrorHandler {
  protected next: ErrorHandler | null = null;

  setNext(handler: ErrorHandler) {
    this.next = handler;
  }

  async handle(error: Error) {
    if (this.next === null) return;
    this.next.handle(error);
  }
}
