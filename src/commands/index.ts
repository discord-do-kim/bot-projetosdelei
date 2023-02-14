import { ProjectsCommand } from "../addons/projetosDeLei/ProjectsCommand";
import { VoiceMod } from "../addons/voiceMod/voiceMod";
import { CommandPattern } from "./CommandPattern";
import { CronometerCommand } from "./CronometerCommand";

const commands: CommandPattern[] = [
  new ProjectsCommand(),
  new CronometerCommand(),
  new VoiceMod(),
];

export default commands;
