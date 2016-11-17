import {kernel, Command} from 'firmament-yargs';
import {BashCommandImpl} from "./implementations/commands/bash-command-impl";

kernel.bind<Command>('Command').to(BashCommandImpl);

export default kernel;
