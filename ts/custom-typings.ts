interface ShellCommand {
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
interface ExecutionGraphOptions {
  displayExecutionGraphDescription: boolean;
}
interface ExecutionGraph {
  description: string;
  options: ExecutionGraphOptions;
  prerequisiteGraph: ExecutionGraph;
  prerequisiteGraphUri: string;
  asynchronousCommands: ShellCommand[];
  serialSynchronizedCommands: ShellCommand[];
}
interface ReadableStream {
  isTTY: boolean
}
