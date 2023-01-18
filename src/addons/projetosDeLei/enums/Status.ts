import { Colors } from "discord.js";

export enum Status {
  "accepted" = "Aceito",
  "pending" = "Pendente",
  "rejected" = "Rejeitado",
}

export enum StatusColors {
  "pending" = Colors.Blue,
  "accepted" = Colors.Green,
  "rejected" = Colors.Red,
}
