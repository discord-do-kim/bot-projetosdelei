import { config } from "dotenv";

config();

export const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
export const MONGO_SRV = process.env.MONGO_SRV;
