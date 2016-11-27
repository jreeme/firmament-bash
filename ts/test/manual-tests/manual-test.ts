import 'reflect-metadata';
import kernel from '../../inversify.config';
import {ProcessCommandJson} from "../../interfaces/process-command-json";
let processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');

const scriptPath = "/home/jreeme/src/firmament-bash/command-json/valid.json"
const errorScriptPath = "/home/jreeme/src/firmament-bash/command-json/valid-error.json"
const sudoScriptPath = "/home/jreeme/src/firmament-bash/command-json/valid-sudo.json"
processCommandJson.process(sudoScriptPath, (err, result) => {
  process.exit(0);
});

//noinspection JSUnusedLocalSymbols
/*
 spawn.sudoSpawnAsync(['node', '/home/jreeme/src/firmament-yargs/js/test/test-00.js'], null,
 (err, result) => {
 let msg = spawn.commandUtil.returnErrorStringOrMessage(err, result);
 spawn.commandUtil.stdoutWrite(msg);
 },
 (err, result) => {
 spawn.commandUtil.processExitWithError(err, 'OK');
 }
 );
 */
