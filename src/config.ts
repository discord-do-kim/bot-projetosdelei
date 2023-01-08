import { config } from "dotenv";
import path from "path";

config({
  path: path.join(__dirname, `../.env.${process.env.NODE_ENV}`),
});

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const DISCORD_GUILD_TEST_ID = process.env.DISCORD_GUILD_TEST_ID;
export const LOG_WEBHOOK = process.env.LOG_WEBHOOK;
