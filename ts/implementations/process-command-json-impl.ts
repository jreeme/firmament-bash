import {injectable, inject} from 'inversify';
import {ProcessCommandJson} from "../interfaces/process-command-json";
import {CommandUtil, ForceErrorImpl, Spawn, SpawnOptions2} from "firmament-yargs";
import {ExecutionGraph, ShellCommand} from "../interfaces/execution-graph";
import path = require('path');
import fs = require('fs');
import url = require('url');
import request = require('request');
const async = require('async');
const chalk = require('chalk');
const fileExists = require('file-exists');
const textColors = ['green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];
@injectable()
export class ProcessCommandJsonImpl extends ForceErrorImpl implements ProcessCommandJson {
  private commandUtil: CommandUtil;
  private spawn: Spawn;

  constructor(@inject('CommandUtil')_commandUtil: CommandUtil,
              @inject('Spawn')_spawn: Spawn) {
    super();
    this.commandUtil = _commandUtil;
    this.spawn = _spawn;
  }

  processJson(argv: any) {
    this.process(argv.input, (err: Error, result: string) => {
      this.commandUtil.processExitWithError(err);
    });
  }

  process(jsonOrUri: string, cb: (err: Error, result: string)=>void): void {
    cb = this.checkCallback(cb);
    if (this.checkForceError('ProcessCommandJsonImpl.process', cb)) {
      return;
    }
    this.resolveExecutionGraph(jsonOrUri, (err, executionGraph) => {
      if (this.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      //noinspection JSUnusedLocalSymbols,JSUnusedLocalSymbols
      this.execute(executionGraph, cb);
    });
  }

  private execute(executionGraph: ExecutionGraph, cb: (err: Error, result: any)=>void) {
    cb = this.checkCallback(cb);
    let graphCursor = executionGraph;
    let executionGraphs: ExecutionGraph[] = [];
    executionGraphs.unshift(graphCursor);
    while (graphCursor = graphCursor.prerequisiteGraph) {
      executionGraphs.unshift(graphCursor);
    }
    this.preProcessExecutionGraphs(executionGraphs, (err: Error, fnArray: any[]) => {
      if (this.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      async.series(fnArray, cb);
    });
  }

  private preProcessExecutionGraphs(executionGraphs: ExecutionGraph[], cb: (err: Error, fnArray: any[])=>void) {
    cb = this.checkCallback(cb);
    //Give all properties of executionGraph reasonable values so we don't clutter other code up
    //with defaults & checks
    let counter = 0;
    let useSudo = false;
    let fnArray = [];
    executionGraphs.forEach(executionGraph => {
      let eg = executionGraph;
      eg.description = eg.description || 'ExecutionGraph +';
      eg.options = eg.options || {displayExecutionGraphDescription: true};
      eg.prerequisiteGraph = eg.prerequisiteGraph || null;
      eg.prerequisiteGraphUri = eg.prerequisiteGraphUri || null;
      eg.asynchronousCommands = eg.asynchronousCommands || [];
      eg.serialSynchronizedCommands = eg.serialSynchronizedCommands || [];
      [eg.asynchronousCommands, eg.serialSynchronizedCommands].forEach(commands => {
        commands.forEach(command => {
          command.outputColor = command.outputColor || textColors[counter++ % textColors.length];
          if (command.useSudo) {
            useSudo = command.useSudo;
          }
        });
      });
      fnArray.push(async.apply(this.executeSingleGraph.bind(this), executionGraph));
    });
    if (useSudo) {
      //Because launching several async processes requiring a password would ask the user multiple times
      //for a password, we just do it once here to cache the password.
      this.spawn.sudoSpawnAsync(['echo', 'unicorn'], {}, (err: Error) => {
        if (this.commandUtil.callbackIfError(cb, err)) {
          return;
        }
        cb(null, fnArray);
      });
    } else {
      cb(null, fnArray);
    }
  }

  private executeSingleGraph(executionGraph: ExecutionGraph, cb: (err: Error, result: any)=>void) {
    cb = this.checkCallback(cb);
    if (!executionGraph) {
      cb(new Error('Invalid executionGraph'), null);
      return;
    }
    let eg = executionGraph;
    if (eg.options.displayExecutionGraphDescription) {
      this.commandUtil.log(chalk['green'](`Starting execution graph '${eg.description}'`));
    }
    //Use firmament-yargs:spawn services to execute commands
    //1) First do the asynchronous ones
    //2) Then do the synchronous ones (in order)
    let spawnFnArray = [
      async.apply(this.executeAsynchronousCommands.bind(this), eg.asynchronousCommands),
      async.apply(this.executeSynchronousCommands.bind(this), eg.serialSynchronizedCommands)
    ];

    //noinspection JSUnusedLocalSymbols
    async.series(spawnFnArray, (err: Error, results: any) => {
      if (this.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      let msg = `Execution graph '${eg.description}' completed.`;
      if (eg.options.displayExecutionGraphDescription) {
        this.commandUtil.log(chalk['green'](msg));
      }
      cb(null, msg);
    });
  }

  private executeAsynchronousCommands(commands: ShellCommand[], cb: (err: Error, results: string[])=>void) {
    async.parallel(this.createSpawnFnArray(commands), cb);
  }

  private executeSynchronousCommands(commands: ShellCommand[], cb: (err: Error, results: string[])=>void) {
    async.series(this.createSpawnFnArray(commands), cb);
  }

  private createSpawnFnArray(commands: ShellCommand[]): any[] {
    let spawnFnArray = [];
    commands.forEach(command => {
      //Pipelined commands
      if (command.commandPipeline) {
        let fnSpawn = command.useSudo
          //? this.spawn.sudoSpawnPipelineAsync.bind(this.spawn)
          ? this.spawn.spawnShellCommandPipelineAsync.bind(this.spawn)
          : this.spawn.spawnShellCommandPipelineAsync.bind(this.spawn);
        let cmdArray: string[][] = [];
        let optionsArray: SpawnOptions2[] = [];
        command.commandPipeline.forEach(subCommand => {
          let cmd = subCommand.args.slice(0);
          cmd.unshift(subCommand.command);
          cmdArray.push(cmd);
          optionsArray.push(this.buildSpawnOptions(subCommand));
        });
        spawnFnArray.push(async.apply(fnSpawn,
          cmdArray,
          optionsArray,
          this.buildSpawnCallback(command)));
      } else {
        //Non-pipelined commands
        let fnSpawn = command.useSudo
          ? this.spawn.sudoSpawnAsync.bind(this.spawn)
          : this.spawn.spawnShellCommandAsync.bind(this.spawn);
        let cmd = command.args.slice(0);
        cmd.unshift(command.command);
        spawnFnArray.push(async.apply(fnSpawn,
          cmd,
          this.buildSpawnOptions(command),
          this.buildSpawnCallback(command)));
      }
    });
    return spawnFnArray;
  }

  private buildSpawnCallback(command: ShellCommand): (err: Error, results: string)=>void {
    return (err: Error, results: string) => {
      if (err) {
        this.commandUtil.stdoutWrite(chalk['red'](err.message));
        return;
      }
      this.commandUtil.stdoutWrite(chalk[command.outputColor](results));
    };
  }

  private buildSpawnOptions(command: ShellCommand): SpawnOptions2 {
    let workingDirectory: string;
    if (command.workingDirectory) {
      workingDirectory = command.workingDirectory;
      workingDirectory = path.isAbsolute(workingDirectory)
        ? workingDirectory
        : path.resolve(process.cwd(), workingDirectory);
    }

    return {
      preSpawnMessage: command.showPreAndPostSpawnMessages
        ? `Starting task '${command.description}'\n`
        : null,
      postSpawnMessage: command.showPreAndPostSpawnMessages
        ? `Task '${command.description}' completed\n`
        : null,
      showDiagnostics: command.showDiagnostics,
      suppressOutput: command.suppressOutput,
      cwd: workingDirectory
    };
  }

  private resolveExecutionGraph(jsonOrUri: string, cb: (err: Error, executionGraph: ExecutionGraph)=>void) {
    cb = this.checkCallback(cb);
    this.resolveJsonString(jsonOrUri, (err: Error, json: string) => {
      if (this.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      let executionGraph: ExecutionGraph;
      try {
        executionGraph = JSON.parse(json);
      } catch (err) {
        cb(err, null);
        return;
      }
      if (executionGraph.prerequisiteGraphUri) {
        this.resolveExecutionGraph(executionGraph.prerequisiteGraphUri, (err: Error, subExecutionGraph: ExecutionGraph) => {
          if (this.commandUtil.callbackIfError(cb, err)) {
            return;
          }
          executionGraph.prerequisiteGraph = subExecutionGraph;
          cb(null, executionGraph);
        });
      } else {
        cb(null, executionGraph);
      }
    });
  }

  //Right now uri can be a web address (http(s)://somewhere.com/some.json) or an absolute path (/tmp/some.json)
  //or a path relative to cwd (subdir/some.json)
  private resolveJsonString(uri: string, cb: (err: Error, json: string)=>void) {
    cb = this.checkCallback(cb);
    try {
      let parsedUri = url.parse(uri);
      if (!parsedUri.protocol) {
        //Not a web address, maybe a local file
        uri = path.isAbsolute(uri) ? uri : path.resolve(process.cwd(), uri);
        if (!fileExists(uri)) {
          cb(new Error(`${uri} doesn't exist`), null);
          return;
        }
        cb(null, fs.readFileSync(uri, 'utf8'));
        return;
      }
      //Let's look on the web
      request(uri, (err, res, body) => {
        (res.statusCode != 200)
          ? cb(new Error('URI not found'), null)
          : cb(err, body);
      });
    }
    catch (err) {
      cb(err, null);
    }
  }
}
