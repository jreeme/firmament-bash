import 'reflect-metadata';
import kernel from '../../inversify.config';
import {ProcessCommandJson} from '../../interfaces/process-command-json';
let processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');

const installNewman3 = '/home/jreeme/src/firmament-bash/command-json/install-newman3-00.json';
processCommandJson.processJson(
  {
    input: installNewman3
  }
);

