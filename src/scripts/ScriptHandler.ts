import { client } from "../client";

export abstract class ScriptHandler {
  public client = client;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async run(...args: any[]): Promise<any> {
    //
  }
}
