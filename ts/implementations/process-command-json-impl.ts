import {injectable, inject} from 'inversify';
import {ProcessCommandJson} from '../interfaces/process-command-json';
import {
  CommandUtil, ForceErrorImpl, RemoteCatalogGetter,
  RemoteCatalogEntry, SafeJson, Spawn, SpawnOptions2
} from 'firmament-yargs';
import * as _ from 'lodash';
import path = require('path');
import {ExecutionGraph, ShellCommand} from '../custom-typings';
import {ExecutionGraphResolver} from "../interfaces/execution-graph-resolver";

const async = require('async');
const chalk = require('chalk');
const textColors = ['green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray'];
const commandCatalogUrl = 'https://raw.githubusercontent.com/jreeme/firmament-bash/master/command-json/commandCatalog.json';

@injectable()
export class ProcessCommandJsonImpl extends ForceErrorImpl implements ProcessCommandJson {
  constructor(@inject('CommandUtil') private commandUtil: CommandUtil,
              @inject('RemoteCatalogGetter') private remoteCatalogGetter: RemoteCatalogGetter,
              @inject('ExecutionGraphResolver') private executionGraphResolver: ExecutionGraphResolver,
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
    me.executionGraphResolver.resolveExecutionGraphFromCatalogEntry(catalogEntry, (err, executionGraph) => {
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
    me.executionGraphResolver.resolveExecutionGraph(jsonOrUri, (err, executionGraph) => {
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
    //async.parallel(this.createSpawnFnArray(commands), cb);
    async.parallel(this.createSpawnFnArray(commands), (err, result) => {
      cb(err, result);
    });
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
        this.commandUtil.stdoutWrite(chalk['redBright'](err.message));
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
      preSpawnMessage: command.suppressPreAndPostSpawnMessages
        ? null
        : `Starting task '${command.description}'\n`,
      postSpawnMessage: command.suppressPreAndPostSpawnMessages
        ? null
        : `Task '${command.description}' completed\n`,
      suppressDiagnostics: command.suppressDiagnostics,
      cacheStdErr: true,
      cacheStdOut: false,
      sudoUser: command.sudoUser,
      sudoPassword: command.sudoPassword,
      suppressResult: command.suppressOutput,
      suppressStdErr: command.suppressOutput,
      suppressStdOut: command.suppressOutput,
      suppressFinalError: command.suppressFinalError,
      cwd: workingDirectory
    };
  }

}
