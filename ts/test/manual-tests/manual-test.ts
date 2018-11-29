import 'reflect-metadata';
import kernel from '../../inversify.config';
import {ProcessCommandJson} from '../../interfaces/process-command-json';
import {CommandUtil, RemoteCatalogGetter, SpawnOptions2} from 'firmament-yargs';
import {ExecutionGraph, ShellCommand} from '../../custom-typings';

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

const touchRemotely: ShellCommand = {
  description: "touch remotely, say hello",
  suppressOutput: false,
  suppressDiagnostics: false,
  suppressPreAndPostSpawnMessages: true,
  outputColor: "",
  remoteHost: "192.168.104.69",
  remoteUser: "jreeme",
  remoteSshKeyPath: "/home/jreeme/.ssh/id_rsa",
  //remotePassword: "password",
  useSudo: false,
  workingDirectory: ".",
  command: "touch",
  args: [
    "/tmp/hello"
  ]
};
const testExecutionGraph: ExecutionGraph = {
  description: "Test touch remote server",
  options: {
    "displayExecutionGraphDescription": true
  },
  asynchronousCommands: [],
  serialSynchronizedCommands: []
};
/*processCommandJson.processExecutionGraphJson(JSON.stringify(buildAllDockerImages), (err, result) => {
  const e = err;
});*/
for(let i = 0; i < 10; ++i) {
  const tr0 = Object.assign({}, touchRemotely);
  tr0.args = [
    `/tmp/hello-s-${i}`
  ];
  testExecutionGraph.serialSynchronizedCommands.push(tr0);
  const tr1 = Object.assign({}, touchRemotely);
  tr1.args = [
    `/tmp/hello-a-${i}`
  ];
  testExecutionGraph.asynchronousCommands.push(tr1);
}
processCommandJson.processExecutionGraph(testExecutionGraph, (err, result) => {
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
