import {kernel, Command} from 'firmament-yargs';
import {BashCommandImpl} from './implementations/commands/bash-command-impl';
import {ProcessCommandJsonImpl} from './implementations/process-command-json-impl';
import {ProcessCommandJson} from './interfaces/process-command-json';

kernel.bind<ProcessCommandJson>('ProcessCommandJson').to(ProcessCommandJsonImpl).inSingletonScope();
kernel.bind<Command>('Command').to(BashCommandImpl).inSingletonScope();

export default kernel;
