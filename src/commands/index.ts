import { ProjectsCommand } from "../addons/projetosDeLei/ProjectsCommand";
import { CronometroCommand } from "../addons/cronometro/CronometroCommand"
import { CommandPattern } from "./CommandPattern";

const commands: CommandPattern[] = [new ProjectsCommand(), new CronometroCommand()];

export default commands;
