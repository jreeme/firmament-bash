import {ChildProcess} from 'child_process';
import {CommandUtil, ForceError, SpawnOptions2} from "firmament-yargs";
export interface Spawn extends ForceError {
  spawnShellCommandAsync(cmd: string[],
                         options: SpawnOptions2,
                         cbStatusOrFinal: (err: Error, result: string) => void,
                         cbFinal: (err: Error, result: string) => void,
                         cbDiagnostic?: (message: string) => void): ChildProcess;
  sudoSpawnAsync(cmd: string[],
                 options: SpawnOptions2,
                 cbStatusOrFinal: (err: Error, result: string) => void,
                 cbFinal: (err: Error, result: string) => void): ChildProcess;
}
