import 'reflect-metadata';
import kernel from '../../inversify.config';
import {ProcessCommandJson} from '../../interfaces/process-command-json';
let processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');

const input = '/home/jreeme/src/firmament-bash/command-json/install-newman3-00-dev.json';
//const input = '/home/jreeme/src/firmament-bash/command-json/install-newman3-01.json';
//const input = 'flig-niffer';
//const input = '';
//const input = 'firmament-dev';
const catalogPath = '/home/jreeme/src/firmament-bash/command-json/commandCatalog.json';
//const catalogPath = '/home/jreeme/src/firmament-bash/command-json/badCat.jspoon';
processCommandJson.processYargsCommand(
  {
    input,
    catalogPath
  }
);

