export interface ShellCommand {
  description: string;
  outputColor: string;
  workingDirectory: string;
  suppressOutput: boolean;
  suppressFinalError: boolean,
  showDiagnostics: boolean;
  showPreAndPostSpawnMessages: boolean;
  useSudo: boolean;
  sudoUser: string;
  sudoPassword: string;
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

