export abstract class Handler {
  protected next: Handler | null = null;

  setNext(handler: Handler) {
    this.next = handler;
  }

  handle(event: any) {
    if (this.next) {
      this.next.handle(event);
    }
  }
}
