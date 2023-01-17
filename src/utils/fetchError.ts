import { EmbedBuilder } from "discord.js";

export async function fetchError(e: any) {
  return fetch(
    "https://discord.com/api/webhooks/1064686839203631114/Z_89YnpLHZUrc1mgfgVo2qSzaU220w3EoHeVfnpj8vuwCsMoHKj4fH_z23PCi0Ih85AO",
    {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({
        embeds: [
          new EmbedBuilder({
            title: e.name,
            description: e.stack,
            footer: { text: e.message },
            timestamp: new Date(),
          }).toJSON(),
        ],
      }),
    }
  );
}
