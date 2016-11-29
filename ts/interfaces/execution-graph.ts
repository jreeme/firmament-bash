export interface ShellCommand {
  description: string;
  outputColor: string;
  workingDirectory: string;
  suppressOutput: boolean;
  showDiagnostics: boolean;
  showPreAndPostSpawnMessages: boolean;
  useSudo: boolean;
  command: string;
  args: string[];
  commandPipeline: ShellCommand[];
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
