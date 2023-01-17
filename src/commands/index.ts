import { ProjectsCommand } from "../addons/projetosDeLei/ProjectsCommand";
import { CommandPattern } from "./CommandPattern";

const commands: CommandPattern[] = [new ProjectsCommand()];

export default commands;
