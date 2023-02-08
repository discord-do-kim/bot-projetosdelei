import { ProjectsCommand } from "../addons/projetosDeLei/ProjectsCommand";
import { CommandPattern } from "./CommandPattern";
import { VoiceMod } from "./VoiceMod";

const commands: CommandPattern[] = [new ProjectsCommand(), new VoiceMod()];

export default commands;
