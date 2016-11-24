export interface ShellCommand {
  description: string;
  command: string;
  args: string[];
}
export interface ExecutionGraph {
  description: string;
  prerequisiteGraph: string|ExecutionGraph;
  serialSynchronizedCommands: ShellCommand[],
  asynchronousCommands: ShellCommand[]
}
