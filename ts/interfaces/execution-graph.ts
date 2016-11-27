export interface ShellCommand {
  description: string;
  outputColor: string;
  suppressOutput: boolean;
  showDiagnostics: boolean;
  showPreAndPostSpawnMessages: boolean;
  useSudo: boolean,
  command: string;
  args: string[];
}
export interface ExecutionGraphOptions {
  displayExecutionGraphDescription: boolean;
}
export interface ExecutionGraph {
  description: string;
  options: ExecutionGraphOptions;
  prerequisiteGraph: ExecutionGraph;
  prerequisiteGraphUri: string;
  asynchronousCommands: ShellCommand[];
  serialSynchronizedCommands: ShellCommand[];
}
