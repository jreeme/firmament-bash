import {kernel, Command} from 'firmament-yargs';
import {BashCommandImpl} from './implementations/commands/bash-command-impl';
import {ProcessCommandJsonImpl} from './implementations/process-command-json-impl';
import {ProcessCommandJson} from './interfaces/process-command-json';
import {Spawn} from "./interfaces/spawn";
import {SpawnImpl} from "./implementations/spawn-impl";

kernel.bind<ProcessCommandJson>('ProcessCommandJson').to(ProcessCommandJsonImpl).inSingletonScope();
kernel.bind<Command>('Command').to(BashCommandImpl).inSingletonScope();

kernel.rebind<Spawn>('Spawn').to(SpawnImpl).inTransientScope();

export default kernel;
