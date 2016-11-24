import {ExecutionGraph, ShellCommand} from "../interfaces/execution-graph";
export class ShellCommandImpl implements ShellCommand {
  description: string;
  command: string;
  args: string[];
}
export class ExecutionGraphImpl implements ExecutionGraph {
  description: string;
  prerequisiteGraph: string|ExecutionGraph;
  serialSynchronizedCommands: ShellCommand[];
  asynchronousCommands: ShellCommand[];
}
