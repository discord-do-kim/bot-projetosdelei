/* eslint-disable @typescript-eslint/no-unused-vars */
type handlerFunction = (...args: any[]) => Promise<any>;

export abstract class EventHandler {
  protected abstract handlers: Map<any, any>;

  public abstract register(...args: any[]): any;

  public abstract handle(...args: any[]): Promise<any>;
}
