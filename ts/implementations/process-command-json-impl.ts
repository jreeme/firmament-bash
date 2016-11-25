import {injectable, inject} from 'inversify';
import {ProcessCommandJson} from "../interfaces/process-command-json";
import {CommandUtil, ForceErrorImpl, Spawn} from "firmament-yargs";
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

  process(jsonOrUri: string, cb: (err: Error, result: string)=>void): void {
    cb = this.checkCallback(cb);
    if (this.checkForceError('ProcessCommandJsonImpl.process', cb)) {
      return;
    }
    this.resolveExecutionGraph(jsonOrUri, (err, executionGraph) => {
      if (this.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      this.execute(executionGraph, (err: Error, a: any) => {
      });
    });
  }

  private execute(executionGraph: ExecutionGraph, cb: (err: Error, executionGraph: ExecutionGraph)=>void) {
    cb = this.checkCallback(cb);
    let graphCursor = executionGraph;
    let fnArray = [];
    let executionGraphs: ExecutionGraph[] = [];
    executionGraphs.unshift(graphCursor);
    while (graphCursor = graphCursor.prerequisiteGraph) {
      executionGraphs.unshift(graphCursor);
    }
    this.preProcessExecutionGraphs(executionGraphs, fnArray);
    async.series(fnArray, (err, res) => {
      cb(null, null);
    });
  }

  private preProcessExecutionGraphs(executionGraphs: ExecutionGraph[], fnArray: any[]) {
    //Give all properties of executionGraph reasonable values so we don't clutter other code up
    //with defaults & checks
    let counter = 0;
    executionGraphs.forEach(executionGraph => {
      let eg = executionGraph;
      eg.description = eg.description || 'ExecutionGraph +';
      eg.options = eg.options || {quietSpawn: false};
      eg.prerequisiteGraph = eg.prerequisiteGraph || null;
      eg.prerequisiteGraphUri = eg.prerequisiteGraphUri || null;
      eg.asynchronousCommands = eg.asynchronousCommands || [];
      eg.serialSynchronizedCommands = eg.serialSynchronizedCommands || [];
      [eg.asynchronousCommands, eg.serialSynchronizedCommands].forEach(commands => {
        commands.forEach(command => {
          command.outputColor = command.outputColor || textColors[counter++ % textColors.length];
        });
      });
      fnArray.push(async.apply(this.executeSingleGraph.bind(this), executionGraph));
    });
  }

  private executeSingleGraph(executionGraph: ExecutionGraph, cb: (err: Error, result: any)=>void) {
    cb = this.checkCallback(cb);
    if (!executionGraph) {
      cb(new Error('Invalid executionGraph'), null);
      return;
    }
    let eg = executionGraph;
    this.spawn.commandUtil.quiet = eg.options.quietSpawn;
    //Use firmament-yargs:spawn services to execute commands
    //1) First do the asynchronous ones
    //2) Then do the synchronous ones (in order)
    let spawnFnArray = [
      async.apply(this.executeAsynchronousCommands.bind(this), eg.asynchronousCommands, {}),
      async.apply(this.executeSynchronousCommands.bind(this), eg.serialSynchronizedCommands, {})
    ];

    async.series(spawnFnArray, (err: Error, results: any) => {
      if (this.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      cb(null, executionGraph.description);
    });
  }

  private executeAsynchronousCommands(commands: ShellCommand[], options: any, cb: (err: Error, results: string[])=>void) {
    async.parallel(this.createSpawnFnArray(commands), cb);
  }

  private executeSynchronousCommands(commands: ShellCommand[], options: any, cb: (err: Error, results: string[])=>void) {
    async.series(this.createSpawnFnArray(commands), cb);
  }

  private createSpawnFnArray(commands: ShellCommand[]): any[] {
    let spawnFnArray = [];
    commands.forEach(command => {
      let cmd = command.args.slice(0);
      cmd.unshift(command.command);
      spawnFnArray.push(async.apply(this.spawn.spawnShellCommandAsync.bind(this.spawn),
        cmd,
        {},
        (err: Error, results: string) => {
          if (command.suppressOutput) {
            return;
          }
          if (err) {
            this.commandUtil.stdoutWrite(chalk['red'](err.message));
            return;
          }
          this.commandUtil.stdoutWrite(chalk[command.outputColor](results));
        }));
    });
    return spawnFnArray;
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
