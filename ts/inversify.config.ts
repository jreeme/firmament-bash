import {kernel, Command} from 'firmament-yargs';
import {BashCommandImpl} from './implementations/commands/bash-command-impl';
import {ProcessCommandJsonImpl} from './implementations/process-command-json-impl';
import {ProcessCommandJson} from './interfaces/process-command-json';
import {Spawn} from "./interfaces/spawn";
import {SpawnImpl} from "./implementations/spawn-impl";

kernel.bind<ProcessCommandJson>('ProcessCommandJson').to(ProcessCommandJsonImpl).inSingletonScope();
kernel.bind<Command>('Command').to(BashCommandImpl).inSingletonScope();

//TODO: Move our Spawn implementation and unit test to 'firmament-yargs'
kernel.rebind<Spawn>('Spawn').to(SpawnImpl).inSingletonScope();

export default kernel;
