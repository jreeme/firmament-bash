import {injectable, inject} from 'inversify';
import {ProcessCommandJson} from '../interfaces/process-command-json';
import {
  CommandUtil, ForceErrorImpl, RemoteCatalogGetter,
  RemoteCatalogEntry, SafeJson
} from 'firmament-yargs';
import * as _ from 'lodash';
import path = require('path');
import {Url} from 'url';
import {ExecutionGraph, ShellCommand, SpawnOptions3} from '../custom-typings';
import {Spawn} from "../interfaces/spawn";

const async = require('async');
const chalk = require('chalk');
const nodeUrl = require('url');
const textColors = ['green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];
const commandCatalogUrl = 'https://raw.githubusercontent.com/jreeme/firmament-bash/master/command-json/commandCatalog.json';

@injectable()
export class ProcessCommandJsonImpl extends ForceErrorImpl implements ProcessCommandJson {
  constructor(@inject('CommandUtil') private commandUtil: CommandUtil,
              @inject('RemoteCatalogGetter') private remoteCatalogGetter: RemoteCatalogGetter,
              @inject('SafeJson') private safeJson: SafeJson,
              @inject('Spawn') private spawn: Spawn) {
    super();
  }

  processYargsCommand(argv: any) {
    const me = this;
    argv.catalogPath = argv.catalogPath || commandCatalogUrl;
    //Start by checking to see if argv.input is a url we can just execute and be done with it
    me.processAbsoluteUrl(argv.input, (err: Error) => {
      if (err) {
        const parsedError = me.safeJson.safeParseSync(err.message);
        if (parsedError.err) {
          //This means no process launched (which means argv.input was not a execution graph
          //in a local file). Now we see if it's a graph on the web or list the graphs we know
          //about on the web.
          me.remoteCatalogGetter.getCatalogFromUrl(argv.catalogPath, (err, commandCatalog) => {
            me.commandUtil.processExitIfError(err);
            //If we got a command catalog but user didn't specify anything then list entries in catalog
            if (!argv.input) {
              me.commandUtil.log('\nAvailable templates:\n');
              commandCatalog.entries.forEach(entry => {
                me.commandUtil.log('> ' + entry.name);
              });
              me.commandUtil.processExit();
            }
            //If we got a command catalog and the user specified something check to see if it's a catalog entry
            const commandGraph: RemoteCatalogEntry = _.find(commandCatalog.entries, entry => {
              return entry.name === argv.input;
            });
            //If it is a catalog entry then execute graph from catalog
            me.processCatalogEntry(commandGraph, (err) => {
              me.commandUtil.processExitWithError(new Error(`Invalid execution graph: ${err.message}`));
            });
          });
        } else {
          //This means a local graph executed but exited with an error
          me.commandUtil.processExitWithError(err);
        }
      } else {
        //This is a successful completion of a local graph
        me.commandUtil.processExit();
      }
    });
  }

  processCatalogEntry(catalogEntry: RemoteCatalogEntry, cb: (err: Error, result: string) => void) {
    const me = this;
    cb = me.checkCallback(cb);
    if (me.checkForceError('ProcessCommandJsonImpl.processCatalogEntry', cb)) {
      return;
    }
    me.resolveExecutionGraphFromCatalogEntry(catalogEntry, (err, executionGraph) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      me.execute(executionGraph, cb);
    });
  }

  processAbsoluteUrl(jsonOrUri: string, cb: (err: Error, result: string) => void): void {
    const me = this;
    cb = me.checkCallback(cb);
    if (me.checkForceError('ProcessCommandJsonImpl.processAbsoluteUrl', cb)) {
      return;
    }
    me.resolveExecutionGraph(jsonOrUri, (err, executionGraph) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      me.execute(executionGraph, cb);
    });
  }

  private execute(executionGraph: ExecutionGraph, cb: (err: Error, result: any) => void) {
    const me = this;
    cb = me.checkCallback(cb);
    let graphCursor = executionGraph;
    const executionGraphs: ExecutionGraph[] = [];
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
    const me = this;
    cb = me.checkCallback(cb);
    //Give all properties of executionGraph reasonable values so we don't clutter other code up
    //with defaults & checks
    let counter = 0;
    let useSudo = false;
    let sudoPassword = '';
    const fnArray = [];
    executionGraphs.forEach(executionGraph => {
      const eg = executionGraph;
      eg.description = eg.description || 'ExecutionGraph +';
      eg.options = eg.options || {displayExecutionGraphDescription: true};
      eg.prerequisiteGraph = eg.prerequisiteGraph || null;
      eg.prerequisiteGraphUri = eg.prerequisiteGraphUri || null;
      eg.asynchronousCommands = eg.asynchronousCommands || [];
      eg.serialSynchronizedCommands = eg.serialSynchronizedCommands || [];
      [eg.asynchronousCommands, eg.serialSynchronizedCommands].forEach(commands => {
        commands.forEach(command => {
          command.outputColor = command.outputColor || textColors[counter++ % textColors.length];
          if (!sudoPassword && command.sudoPassword) {
            sudoPassword = command.sudoPassword;
          }
          if (!useSudo && command.useSudo) {
            useSudo = command.useSudo;
          }
        });
      });
      fnArray.push(async.apply(me.executeSingleGraph.bind(me), executionGraph));
    });
    if (useSudo) {
      //Because launching several async processes requiring a password would ask the user multiple times
      //for a password, we just do it once here to cache the password.
      me.spawn.sudoSpawnAsync(
        ['printf', 'unicorn'],
        {sudoPassword},
        () => {
        },
        (err) => {
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
    const me = this;
    cb = me.checkCallback(cb);
    if (!executionGraph) {
      cb(new Error('Invalid executionGraph'), null);
      return;
    }
    const eg = executionGraph;
    if (eg.options.displayExecutionGraphDescription) {
      me.commandUtil.log(chalk['green'](`Starting execution graph '${eg.description}'`));
    }
    //Use firmament-yargs:spawn services to execute commands
    //1) First do the asynchronous ones
    //2) Then do the synchronous ones (in order)
    const spawnFnArray = [
      async.apply(me.executeAsynchronousCommands.bind(me), eg.asynchronousCommands),
      async.apply(me.executeSynchronousCommands.bind(me), eg.serialSynchronizedCommands)
    ];

    //noinspection JSUnusedLocalSymbols
    async.series(spawnFnArray, (err: Error, results: any) => {
      const msg = `Execution graph '${eg.description}' completed.`;
      if (eg.options.displayExecutionGraphDescription) {
        me.commandUtil.log(chalk['green'](msg));
      }
      cb(err, msg);
    });
  }

  private executeAsynchronousCommands(commands: ShellCommand[], cb: (err: Error, results: string[]) => void) {
    async.parallel(this.createSpawnFnArray(commands), cb);
  }

  private executeSynchronousCommands(commands: ShellCommand[], cb: (err: Error, results: string[]) => void) {
    async.series(this.createSpawnFnArray(commands), cb);
  }

  private createSpawnFnArray(commands: ShellCommand[]): any[] {
    const me = this;
    const spawnFnArray = [];
    commands.forEach(command => {
      //Non-pipelined commands
      const fnSpawn = command.useSudo
        ? me.spawn.sudoSpawnAsync.bind(me.spawn)
        : me.spawn.spawnShellCommandAsync.bind(me.spawn);
      const cmd = command.args.slice(0);
      cmd.unshift(command.command);
      spawnFnArray.push(async.apply(fnSpawn,
        cmd,
        me.buildSpawnOptions(command),
        me.buildSpawnCallback(command)));
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

  private buildSpawnOptions(command: ShellCommand): SpawnOptions3 {
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
      sudoPassword: command.sudoPassword,
      suppressFinalStats: command.suppressOutput,
      suppressStdErr: command.suppressOutput,
      suppressStdOut: command.suppressOutput,
      suppressFinalError: command.suppressFinalError,
      cwd: workingDirectory
    };
  }

  private resolveExecutionGraph(url: string, cb: (err: Error, executionGraph?: ExecutionGraph) => void) {
    const me = this;
    cb = me.checkCallback(cb);
    me.remoteCatalogGetter.resolveJsonObjectFromUrl(url, (err, jsonObject) => {
      if (me.commandUtil.callbackIfError(cb, err)) {
        return;
      }
      if (!jsonObject) {
        cb(new Error(`Execution graph at '${url}' not found`));
        return;
      }
      const executionGraph = <ExecutionGraph>jsonObject;
      if (executionGraph.prerequisiteGraphUri) {
        me.resolveExecutionGraph(ProcessCommandJsonImpl.getFullResourcePath(executionGraph.prerequisiteGraphUri, url),
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
    const me = this;
    cb = me.checkCallback(cb);
    try {
      catalogEntry.resources.forEach(resource => {
        const po = resource.parsedObject;
        const preReqUri = po.prerequisiteGraphUri;
        if (preReqUri) {
          const preReq = _.find(catalogEntry.resources, r => {
            return r.name === preReqUri;
          });
          po.prerequisiteGraph = preReq.parsedObject;
          preReq.parsedObject.parent = resource;
        }
      });
      //Find graph with no parent and we know where to start
      const startGraph: ExecutionGraph = (_.find(catalogEntry.resources, resource => {
        return !resource.parsedObject.parent;
      })).parsedObject;

      cb(null, startGraph);
    } catch (err) {
      cb(err);
    }
  }

  private static getFullResourcePath(url: string, parentUrl: string): string {
    let retVal: string;
    const parsedUrl: Url = nodeUrl.parse(url);
    //First, figure out if it's a network resource or filesystem resource
    if (parsedUrl.protocol) {
      //Network resource
      retVal = url;
    } else {
      //Filesystem resource
      if (path.isAbsolute(url)) {
        retVal = url;
      } else {
        const parsedParentUrl: Url = nodeUrl.parse(parentUrl);
        let baseUrl = path.dirname(parentUrl);
        if (parsedParentUrl.protocol) {
          baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}${path.dirname(parsedUrl.path)}`;
        }
        retVal = path.resolve(baseUrl, url);
      }
    }
    return retVal;
  }
}
