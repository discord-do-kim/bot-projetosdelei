import mongoose from "mongoose";

interface Config {
  projetoDeLei: {
    verify: string;
    send: string;
    mention: string;
  };
}

const configSchema = new mongoose.Schema<Config>(
  {
    projetoDeLei: {
      verify: String,
      send: String,
      mention: String,
    },
  },
  { collection: "Config" }
);

export const ConfigModel = mongoose.model("Config", configSchema);
