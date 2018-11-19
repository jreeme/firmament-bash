import 'reflect-metadata';
import kernel from '../../inversify.config';
import {ProcessCommandJson} from '../../interfaces/process-command-json';
import {CommandUtil, RemoteCatalogGetter} from 'firmament-yargs';
import {ExecutionGraph} from '../../custom-typings';

const processCommandJson = kernel.get<ProcessCommandJson>('ProcessCommandJson');
const commandUtil = kernel.get<CommandUtil>('CommandUtil');

const scriptPath = '/home/jreeme/src/firmament-bash/command-json/valid.json';
const errorScriptPath = '/home/jreeme/src/firmament-bash/command-json/valid-error.json';
const sudoScriptPath = '/home/jreeme/src/firmament-bash/command-json/valid-sudo.json';
const pipeScriptPath = '/home/jreeme/src/firmament-bash/command-json/pipe-00.json';
const networkScriptPath = 'https://raw.githubusercontent.com/jreeme/firmament-bash/master/command-json/firmament-dev-00.json';
const remoteCatalogGetter = kernel.get<RemoteCatalogGetter>('RemoteCatalogGetter');
const broScriptPath = '/home/jreeme/bro/bro4.json';
const commandCatalogUrl = '/home/jreeme/src/firmament-bash/command-json/commandCatalog.json';

const testExecutionGraph: ExecutionGraph = {
  description: "Build all Docker images in Parrot stack",
  options: {
    "displayExecutionGraphDescription": true
  },
  asynchronousCommands: [],
  serialSynchronizedCommands: [
    {
      description: "git clone amino3-client",
      suppressOutput: false,
      suppressDiagnostics: false,
      suppressPreAndPostSpawnMessages: true,
      outputColor: "",
      remoteHost: "192.168.0.105",
      remoteUser: "jreeme",
      remotePassword: "password",
      useSudo: false,
      workingDirectory: ".",
      command: "touch",
      args: [
        "/tmp/hello"
      ]
    }
  ]
};
/*processCommandJson.processExecutionGraphJson(JSON.stringify(buildAllDockerImages), (err, result) => {
  const e = err;
});*/
processCommandJson.execute(testExecutionGraph, (err, result) => {
  commandUtil.processExitWithError(err, 'OK');
});
/*remoteCatalogGetter.getCatalogFromUrl(commandCatalogUrl, (err, remoteCatalog) => {
 let e = err;
 });*/
/*processCommandJson.processYargsCommand(
  {
    //input: 'glibber'
    //input: 'firmament-dev'
    //input: '/home/jreeme/src/firmament-bash/command-json/prep-ubuntu-16.04-server-00.json'
    input: '/home/jreeme/src/firmament/firmament-bash/command-json/sleeps.json'
  }
);*/
/*processCommandJson.process(networkScriptPath, (err, result) => {
 process.exit(0);
 });*/

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
