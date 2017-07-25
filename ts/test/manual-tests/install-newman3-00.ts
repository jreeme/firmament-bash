import 'reflect-metadata';
import kernel from '../../inversify.config';
import {ProcessCommandJson} from '../../interfaces/process-command-json';
let processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');

const installNewman3 = '/home/jreeme/src/firmament-bash/command-json/install-newman3-01-dev.json';
processCommandJson.processYargsCommand(
  {
    input: installNewman3
  }
);

