import { ProjectsCommand } from "../addons/projetosDeLei/ProjectsCommand";
import { CronometroCommand } from "../addons/cronometro/CronometroCommand"
import { VoiceMod } from "../addons/voiceMod/voiceMod";
import { CommandPattern } from "./CommandPattern";

const commands: CommandPattern[] = [new ProjectsCommand(), new CronometroCommand(), new VoiceMod()];

export default commands;
