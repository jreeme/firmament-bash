import {injectable, inject} from "inversify";
import {Spawn} from '../interfaces/spawn';
import {ChildProcess, spawn} from 'child_process';
import {CommandUtil, ForceErrorImpl, SpawnOptions2} from "firmament-yargs";
const readlineSync = require('readline-sync');
const inpathSync = require('inpath').sync;
const pidof = require('pidof');
const psTree = require('ps-tree');
//noinspection JSUnusedGlobalSymbols
@injectable()
export class SpawnImpl extends ForceErrorImpl implements Spawn {
  private cachedPassword: string;

  constructor(@inject('CommandUtil') public commandUtil: CommandUtil) {
    super();
  }

  private validate_spawnShellCommandAsync_args(cmd: string[],
                                               options: SpawnOptions2,
                                               cbStatus: (err: Error, result: string) => void,
                                               cbFinal: (err: Error, result: string) => void,
                                               cbDiagnostic: (message: string) => void = null) {
    const me = this;
    cmd = cmd || [];
    options = options || {};
    options.preSpawnMessage = options.preSpawnMessage || '';
    options.postSpawnMessage = options.postSpawnMessage || '';
    options.showDiagnostics = options.showDiagnostics || false;
    options.suppressStdErr = options.suppressStdErr || false;
    options.suppressStdOut = options.suppressStdOut || false;
    options.cacheStdErr = options.cacheStdErr || false;
    options.cacheStdOut = options.cacheStdOut || false;
    options.suppressFinalStats = options.suppressFinalStats || false;
    options.stdio = options.stdio || 'pipe';
    options.cwd = options.cwd || process.cwd();
    cbStatus = me.checkCallback(cbStatus);
    cbFinal = me.checkCallback(cbFinal);
    cbDiagnostic = cbDiagnostic || (() => {
      });
    return {cmd, options, cbStatus, cbFinal, cbDiagnostic};
  }

  spawnShellCommandAsync(_cmd: string[],
                         _options: SpawnOptions2,
                         _cbStatus: (err: Error, result: string) => void,
                         _cbFinal: (err: Error, result: string) => void,
                         _cbDiagnostic: (message: string) => void = null) {
    const me = this;
    let {cmd, options, cbStatus, cbFinal, cbDiagnostic}
      = me.validate_spawnShellCommandAsync_args(_cmd, _options, _cbStatus, _cbFinal, _cbDiagnostic);
    if (me.checkForceError('spawnShellCommandAsync', cbFinal)) {
      return;
    }
    let childProcess: ChildProcess;
    try {
      let command = cmd[0];
      let args = cmd.slice(1);
      let stdoutText = '';
      let stderrText = '';
      options.showDiagnostics && cbDiagnostic(`Running '${cmd}' @ '${options.cwd}'`);
      options.preSpawnMessage && cbDiagnostic(options.preSpawnMessage);
      childProcess = spawn(command, args, options);
      childProcess.stderr.on('data', (dataChunk: Uint8Array) => {
        if (options.suppressStdErr && !options.cacheStdErr) {
          return;
        }
        const text = dataChunk.toString();
        !options.suppressStdErr && cbStatus(new Error(text), text);
        options.cacheStdErr && (stderrText += text);
      });
      childProcess.stdout.on('data', (dataChunk: Uint8Array) => {
        if (options.suppressStdOut && !options.cacheStdOut) {
          return;
        }
        const text = dataChunk.toString();
        !options.suppressStdOut && cbStatus(null, text);
        options.cacheStdOut && (stdoutText += text);
      });
      childProcess.on('error', (code: number) => {
        cbFinal = SpawnImpl.childCloseOrExit(code, '', stdoutText, stderrText, options, cbFinal, cbDiagnostic);
      });
      childProcess.on('exit', (code: number, signal: string) => {
        cbFinal = SpawnImpl.childCloseOrExit(code, signal, stdoutText, stderrText, options, cbFinal, cbDiagnostic);
      });
      childProcess.on('close', (code: number, signal: string) => {
        cbFinal = SpawnImpl.childCloseOrExit(code, signal, stdoutText, stderrText, options, cbFinal, cbDiagnostic);
      });
    } catch (err) {
      cbFinal(err, null);
    }
    return childProcess;
  }

  private static childCloseOrExit(code: number,
                                  signal: string,
                                  stdoutText: string,
                                  stderrText: string,
                                  options: SpawnOptions2,
                                  cbFinal: (err: Error, result: string) => void,
                                  cbDiagnostic: (message: string) => void): (err: Error, result: string) => void {
    if (cbFinal) {
      if (options.postSpawnMessage) {
        cbDiagnostic(options.postSpawnMessage);
      }
      let returnString = !options.suppressFinalStats
        ? JSON.stringify({code, signal, stdoutText, stderrText}, undefined, 2)
        : '';
      let error = (code !== null && code !== 0)
        ? new Error(returnString)
        : null;
      cbFinal(error, returnString);
    }
    return null;
  }

  sudoSpawnAsync(cmd: string[],
                 options: SpawnOptions2,
                 cbStatusOrFinal: (err: Error, result: string) => void,
                 cbFinal: (err: Error, result: string) => void) {
    let me = this;
    let prompt = '#node-sudo-passwd#';
    let prompts = 0;
    let args = ['-S', '-p', prompt];
    cmd = cmd || [];
    cmd = cmd.slice(0);
    [].push.apply(args, cmd);
    let path = process.env['PATH'].split(':');
    let sudoBin = inpathSync('sudo', path);
    args.unshift(sudoBin);

    let child: ChildProcess = me.spawnShellCommandAsync(args, options, cbStatusOrFinal, cbFinal);

    if (!child) {
      //In this case spawnShellCommandAsync should handle the error callbacks
      return;
    }

    function waitForStartup(err, children: any[]) {
      if (err) {
        throw new Error(`Error spawning process`);
      }
      if (children && children.length) {
        child.stderr.removeAllListeners();
      } else {
        setTimeout(function () {
          psTree(child.pid, waitForStartup);
        }, 100);
      }
    }

    psTree(child.pid, waitForStartup);

    child.stderr.on('data', function (data) {
      let lines = data.toString().trim().split('\n');
      lines.forEach(function (line) {
        if (line === prompt) {
          if (++prompts > 1) {
            // The previous entry must have been incorrect, since sudo asks again.
            me.cachedPassword = null;
          }
          let username = require('username').sync();
          let loginMessage = (prompts > 1)
            ? `Sorry, try again.\n[sudo] password for ${username}: `
            : `[sudo] password for ${username}: `;

          if (me.cachedPassword) {
            child.stdin.write(me.cachedPassword + '\n');
          } else {
            me.cachedPassword = readlineSync.question(loginMessage, {hideEchoBack: true});
            child.stdin.write(me.cachedPassword + '\n');
          }
        }
      });
    });
    return child;
  }
}
