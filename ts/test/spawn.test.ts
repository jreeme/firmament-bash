import 'reflect-metadata';
import kernel from '../inversify.config';
import {expect} from 'chai';
//import {} from 'mocha';
import * as sinon from 'sinon';
import * as _ from 'lodash';
import path = require('path');
import {Spawn} from "../interfaces/spawn";
import {SpawnOptions2} from "firmament-yargs";

function getNewSpawnOptions(): SpawnOptions2 {
  return _.clone({
    preSpawnMessage: 'PreSpawn Message',
    postSpawnMessage: 'PostSpawn Message',
    showDiagnostics: true,
    suppressStdErr: true,
    suppressStdOut: true,
    cacheStdErr: true,
    cacheStdOut: true,
    suppressFinalStats: true
  });
}
describe('Testing Spawn', () => {
  const pathToScripts = path.resolve(__dirname, '../../ts/test/shell-scripts');
  it('should be created by kernel', (done) => {
    const spawn = kernel.get<Spawn>('Spawn');
    expect(spawn).to.not.equal(null);
    done();
  });
  it('should have final callback with error', (done) => {
    const spawn = kernel.get<Spawn>('Spawn');
    spawn.forceError = true;
    spawn.spawnShellCommandAsync(null, null, null,
      (err) => {
        expect(err).to.not.equal(null);
        done();
      });
  });
  it('should execute, no output to stderr or stdout, exitcode => 0', (done) => {
    const spawn = kernel.get<Spawn>('Spawn');
    const testScript = path.resolve(pathToScripts, 'kitchen-sink.sh');
    const spawnOptions = getNewSpawnOptions();
    spawnOptions.cacheStdOut = false;
    spawn.spawnShellCommandAsync([
        testScript,
        '1'
      ],
      spawnOptions,
      (err, result) => {
        let e = err;
      },
      (err, result) => {
        let e = err;
        done();
      },
      (message) => {
        console.log(message);
      }
    );
  });
  /*  describe(`execute force error`, () => {
   spawn.forceError = true;
   spawn.spawnShellCommandAsync([], {},
   (err, result) => {
   let e = err;
   },
   (err, result) => {
   let e = err;
   });
   });
   describe(`execute 'success-no-output.sh'`, () => {
   it('should execute, no output to stderr or stdout, exitcode => 0', (done) => {
   const testScript = path.resolve(pathToScripts, 'success-no-output.sh');
   spawn.spawnShellCommandAsync([
   testScript
   ],
   {},
   (err, result) => {
   let e = err;
   },
   (err, result) => {
   let e = err;
   }
   );
   done();
   });
   });*/
});

