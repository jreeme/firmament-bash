import {injectable, inject} from 'inversify';
import {ProcessCommandJson} from "../interfaces/process-command-json";
import {
  CommandUtil, ForceErrorImpl, Spawn, SpawnOptions2, RemoteCatalogGetter,
  RemoteCatalogEntry
} from "firmament-yargs";
import {ExecutionGraph, ShellCommand} from "../interfaces/execution-graph";
import * as _ from 'lodash';
import path = require('path');
import fs = require('fs');
import url = require('url');
import request = require('request');
const async = require('async');
const chalk = require('chalk');
const textColors = ['green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];
//const commandCatalogUrl = '/home/jreeme/src/firmament-bash/command-json/commandCatalog.json';
const commandCatalogUrl = 'https://raw.githubusercontent.com/jreeme/firmament-bash/master/command-json/commandCatalog.json';

@injectable()
export class ProcessCommandJsonImpl extends ForceErrorImpl implements ProcessCommandJson {

  constructor(@inject('CommandUtil') private commandUtil: CommandUtil,
              @inject('RemoteCatalogGetter') private remoteCatalogGetter: RemoteCatalogGetter,
              @inject('Spawn') private spawn: Spawn) {
    super();
  }

  processJson(argv: any) {
    let me = this;
    //Start by trying to get command catalog. If that fails assume input is absolute location of
    //command graph resource
    me.remoteCatalogGetter.getCatalogFromUrl(commandCatalogUrl, (err, commandCatalog) => {
      if (err || !commandCatalog) {
        me.processAbsoluteUrl(argv.input, (err: Error) => {
          me.commandUtil.processExitWithError(err);
        });
        return;
      }
      //If we got a command catalog but user didn't specify anything then list entries in catalog
      if (!argv.input) {
        me.commandUtil.log('\nAvailable templates:\n');
        me.remoteCatalogGetter.getCatalogFromUrl(commandCatalogUrl, (err, commandCatalog) => {
          commandCatalog.entries.forEach(entry => {
            me.commandUtil.log('> ' + entry.name);
          });
          me.commandUtil.processExit();
        });
        return;
      }
      //If we got a command catalog and the user specified something check to see if it's a catalog entry
      let commandGraph: RemoteCatalogEntry = _.find(commandCatalog.entries, entry => {
        return entry.name === argv.input;
      });
      //If it is a catalog entry then execute graph from catalog
      if (commandGraph) {
        me.processCatalogEntry(commandGraph, (err) => {
          me.commandUtil.processExitWithError(err);
        });
        return;
      }
      //If it is not a catalog entry assume absolute location
      me.processAbsoluteUrl(argv.input, (err: Error) => {
        me.commandUtil.processExitWithError(err);
      });
    });
  }

  processCatalogEntry(catalogEntry: RemoteCatalogEntry, cb: (err: Error, result: string) => void) {
    let me = this;
    cb = me.checkCallback(cb);
    if (me.checkForceError('ProcessCommandJsonImpl.processAbsoluteUrl', cb)) {
      return;
    }
    me.resolveExecutionGraphFromCatalogEntry(catalogEntry, (err, executionGraph) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      //noinspection JSUnusedLocalSymbols,JSUnusedLocalSymbols
      me.execute(executionGraph, cb);
    });
  }

  processAbsoluteUrl(jsonOrUri: string, cb: (err: Error, result: string) => void): void {
    let me = this;
    cb = me.checkCallback(cb);
    if (me.checkForceError('ProcessCommandJsonImpl.processAbsoluteUrl', cb)) {
      return;
    }
    me.resolveExecutionGraph(jsonOrUri, (err, executionGraph) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      //noinspection JSUnusedLocalSymbols,JSUnusedLocalSymbols
      me.execute(executionGraph, cb);
    });
  }

  private execute(executionGraph: ExecutionGraph, cb: (err: Error, result: any) => void) {
    let me = this;
    cb = me.checkCallback(cb);
    let graphCursor = executionGraph;
    let executionGraphs: ExecutionGraph[] = [];
    executionGraphs.unshift(graphCursor);
    while (graphCursor = graphCursor.prerequisiteGraph) {
      executionGraphs.unshift(graphCursor);
    }
    me.preProcessExecutionGraphs(executionGraphs, (err: Error, fnArray: any[]) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      async.series(fnArray, cb);
    });
  }

  private preProcessExecutionGraphs(executionGraphs: ExecutionGraph[], cb: (err: Error, fnArray: any[]) => void) {
    let me = this;
    cb = me.checkCallback(cb);
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
      fnArray.push(async.apply(me.executeSingleGraph.bind(me), executionGraph));
    });
    if (useSudo) {
      //Because launching several async processes requiring a password would ask the user multiple times
      //for a password, we just do it once here to cache the password.
      me.spawn.sudoSpawnAsync(['echo', 'unicorn'], {}, (err: Error) => {
        if (me.commandUtil.callbackIfError(cb, err)) {
          return;
        }
        cb(null, fnArray);
      });
    } else {
      cb(null, fnArray);
    }
  }

  private executeSingleGraph(executionGraph: ExecutionGraph, cb: (err: Error, result: any) => void) {
    let me = this;
    cb = me.checkCallback(cb);
    if (!executionGraph) {
      cb(new Error('Invalid executionGraph'), null);
      return;
    }
    let eg = executionGraph;
    if (eg.options.displayExecutionGraphDescription) {
      me.commandUtil.log(chalk['green'](`Starting execution graph '${eg.description}'`));
    }
    //Use firmament-yargs:spawn services to execute commands
    //1) First do the asynchronous ones
    //2) Then do the synchronous ones (in order)
    let spawnFnArray = [
      async.apply(me.executeAsynchronousCommands.bind(me), eg.asynchronousCommands),
      async.apply(me.executeSynchronousCommands.bind(me), eg.serialSynchronizedCommands)
    ];

    //noinspection JSUnusedLocalSymbols
    async.series(spawnFnArray, (err: Error, results: any) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      let msg = `Execution graph '${eg.description}' completed.`;
      if (eg.options.displayExecutionGraphDescription) {
        me.commandUtil.log(chalk['green'](msg));
      }
      cb(null, msg);
    });
  }

  private executeAsynchronousCommands(commands: ShellCommand[], cb: (err: Error, results: string[]) => void) {
    async.parallel(this.createSpawnFnArray(commands), cb);
  }

  private executeSynchronousCommands(commands: ShellCommand[], cb: (err: Error, results: string[]) => void) {
    async.series(this.createSpawnFnArray(commands), cb);
  }

  private createSpawnFnArray(commands: ShellCommand[]): any[] {
    let me = this;
    let spawnFnArray = [];
    commands.forEach(command => {
      //Pipelined commands
      if (command.commandPipeline) {
        let fnSpawn = command.useSudo
          //? me.spawn.sudoSpawnPipelineAsync.bind(me.spawn)
          ? me.spawn.spawnShellCommandPipelineAsync.bind(me.spawn)
          : me.spawn.spawnShellCommandPipelineAsync.bind(me.spawn);
        let cmdArray: string[][] = [];
        let optionsArray: SpawnOptions2[] = [];
        command.commandPipeline.forEach(subCommand => {
          let cmd = subCommand.args.slice(0);
          cmd.unshift(subCommand.command);
          cmdArray.push(cmd);
          optionsArray.push(me.buildSpawnOptions(subCommand));
        });
        spawnFnArray.push(async.apply(fnSpawn,
          cmdArray,
          optionsArray,
          me.buildSpawnCallback(command)));
      } else {
        //Non-pipelined commands
        let fnSpawn = command.useSudo
          ? me.spawn.sudoSpawnAsync.bind(me.spawn)
          : me.spawn.spawnShellCommandAsync.bind(me.spawn);
        let cmd = command.args.slice(0);
        cmd.unshift(command.command);
        spawnFnArray.push(async.apply(fnSpawn,
          cmd,
          me.buildSpawnOptions(command),
          me.buildSpawnCallback(command)));
      }
    });
    return spawnFnArray;
  }

  private buildSpawnCallback(command: ShellCommand): (err: Error, results: string) => void {
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
      cacheStdErr: true,
      cacheStdOut: false,
      suppressFinalStats: command.suppressOutput,
      suppressStdErr: command.suppressOutput,
      suppressStdOut: command.suppressOutput,
      cwd: workingDirectory
    };
  }

  private resolveExecutionGraph(url: string, cb: (err: Error, executionGraph?: ExecutionGraph) => void) {
    let me = this;
    cb = me.checkCallback(cb);
    me.remoteCatalogGetter.resolveJsonObjectFromUrl(url, (err, jsonObject) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      if (!jsonObject) {
        cb(new Error(`Execution graph at '${url}' not found`));
        return;
      }
      let executionGraph = <ExecutionGraph>jsonObject;
      if (executionGraph.prerequisiteGraphUri) {
        me.resolveExecutionGraph(executionGraph.prerequisiteGraphUri,
          (err: Error, subExecutionGraph: ExecutionGraph) => {
            if (me.commandUtil.callbackIfError(cb, err)) {
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

  private resolveExecutionGraphFromCatalogEntry(catalogEntry: RemoteCatalogEntry, cb: (err: Error, executionGraph?: ExecutionGraph) => void) {
    let me = this;
    cb = me.checkCallback(cb);

    catalogEntry.resources.forEach(resource => {
      let po = resource.parsedObject;
      let preReqUri = po.prerequisiteGraphUri;
      if (preReqUri) {
        let preReq = _.find(catalogEntry.resources, r => {
          return r.name === preReqUri;
        });
        po.prerequisiteGraph = preReq.parsedObject;
        preReq.parsedObject.parent = resource;
      }
    });
    //Find graph with no parent and we know where to start
    let startGraph: ExecutionGraph = (_.find(catalogEntry.resources, resource => {
      return !resource.parsedObject.parent;
    })).parsedObject;

    cb(null, startGraph);
  }
}
