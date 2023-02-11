import { config } from "dotenv";

config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN ?? "";
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? "";
export const MONGO_SRV = process.env.MONGO_SRV ?? "";
export const PRJ_LEI_MENTION = process.env.PRJ_LEI_MENTION  ?? "";
export const PRJ_LEI_SEND_CHANNEL = process.env.PRJ_SEND_CHANNEL ?? "";
export const PRJ_LEI_VERIFY_CHANNEL = process.env.PRJ_LEI_VERIFY_CHANNEL ?? "";