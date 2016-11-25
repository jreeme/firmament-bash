export interface ShellCommand {
  description: string;
  command: string;
  args: string[];
}
export interface ExecutionGraph {
  description: string;
  prerequisiteGraph: ExecutionGraph;
  prerequisiteGraphUri: string;
  serialSynchronizedCommands: ShellCommand[];
  asynchronousCommands: ShellCommand[];
}
