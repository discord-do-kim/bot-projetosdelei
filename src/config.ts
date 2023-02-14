import { config } from "dotenv";

// load .env file or .env.development file if in development mode
config({
  path: process.env.NODE_ENV === "development" ? ".env.development" : ".env",
});

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN ?? "";
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "";
export const MONGO_SRV = process.env.MONGO_SRV ?? "";
export const PRJ_LEI_MENTION_USER = process.env.PRJ_LEI_MENTION_USER ?? "";
export const PRJ_LEI_SEND_CHANNEL = process.env.PRJ_LEI_SEND_CHANNEL ?? "";
export const PRJ_LEI_VERIFY_CHANNEL = process.env.PRJ_LEI_VERIFY_CHANNEL ?? "";
