export interface ShellCommand {
  description: string;
  outputColor: string;
  suppressOutput: boolean;
  command: string;
  args: string[];
}
export interface ExecutionGraphOptions {
  quietSpawn: boolean;
}
export interface ExecutionGraph {
  description: string;
  options: ExecutionGraphOptions;
  prerequisiteGraph: ExecutionGraph;
  prerequisiteGraphUri: string;
  asynchronousCommands: ShellCommand[];
  serialSynchronizedCommands: ShellCommand[];
}
