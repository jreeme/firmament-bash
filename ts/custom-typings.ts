import {SpawnOptions2} from 'firmament-yargs';

export interface ShellCommand extends SpawnOptions2 {
  description?: string;
  outputColor?: string;
  workingDirectory?: string;
  suppressOutput?: boolean;
  suppressPreAndPostSpawnMessages?: boolean;
  useSudo?: boolean;
  command?: string;
  args?: string[];
}

export interface ExecutionGraphOptions {
  displayExecutionGraphDescription: boolean;
}

export interface ExecutionGraph {
  description?: string;
  options?: ExecutionGraphOptions;
  prerequisiteGraph?: ExecutionGraph;
  prerequisiteGraphUri?: string;
  asynchronousCommands?: ShellCommand[];
  serialSynchronizedCommands?: ShellCommand[];
}

