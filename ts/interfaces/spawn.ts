import {ChildProcess} from 'child_process';
import {ForceError} from "firmament-yargs";
import {SpawnOptions3} from "../custom-typings";
export interface Spawn extends ForceError {
  spawnShellCommandAsync(cmd: string[],
                         options: SpawnOptions3,
                         cbStatus: (err: Error, result: string) => void,
                         cbFinal: (err: Error, result: string) => void,
                         cbDiagnostic?: (message: string) => void): ChildProcess;
  sudoSpawnAsync(cmd: string[],
                 options: SpawnOptions3,
                 cbStatus: (err: Error, result: string) => void,
                 cbFinal: (err: Error, result: string) => void,
                 cbDiagnostic?: (message: string) => void): ChildProcess;
}
