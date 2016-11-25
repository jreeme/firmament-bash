import 'reflect-metadata';
import kernel from '../../inversify.config';
import {ProcessCommandJson} from "../../interfaces/process-command-json";
let processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');

processCommandJson.process("/home/jreeme/src/firmament-bash/command-json/valid.json",(err,result)=>{
  let e = err;
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
