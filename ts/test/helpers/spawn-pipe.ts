#!/usr/bin/env node
import {SpawnOptions, ChildProcess, SpawnSyncReturns, spawn, spawnSync} from 'child_process';

let srcChildProc = spawn('/home/jreeme/src/firmament-bash/js/test/helpers/test-00.js',['10','Booozel']);
let dstChildProc = spawn('/home/jreeme/src/firmament-bash/js/test/helpers/test-01.js');

dstChildProc.stdout.pipe(process.stdout);
srcChildProc.stdout.pipe(dstChildProc.stdin);
