import {injectable, inject} from "inversify";
import kernel from '../../inversify.config';
import {Command, CommandUtil} from 'firmament-yargs';
import {ProcessCommandJson} from "../../interfaces/process-command-json";

@injectable()
export class BashCommandImpl implements Command {
  aliases: string[] = [];
  command: string = '';
  commandDesc: string = '';
  //noinspection JSUnusedGlobalSymbols
  //noinspection JSUnusedLocalSymbols,JSUnusedGlobalSymbols
  handler: (argv: any)=>void = (argv: any) => {
  };
  //noinspection JSUnusedGlobalSymbols
  options: any = {};
  subCommands: Command[] = [];
  private commandUtil: CommandUtil;
  private processCommandJson: ProcessCommandJson;

  constructor(@inject('CommandUtil') _commandUtil: CommandUtil,
              @inject('ProcessCommandJson') _processCommandJson: ProcessCommandJson) {
    this.commandUtil = _commandUtil;
    this.processCommandJson = _processCommandJson;
    this.buildCommandTree();
  }

  private buildCommandTree() {
    this.aliases = ['bash'];
    this.command = '<subCommand>';
    this.commandDesc = 'Run bash commands described in JSON files';
    this.pushTestCommand();
  }

  private pushTestCommand() {
    let me = this;
    let processCommand = kernel.get<Command>('CommandImpl');
    processCommand.aliases = ['process','p'];
    processCommand.commandDesc = 'Execute bash command graph described in Json file';
    //noinspection JSUnusedLocalSymbols
    processCommand.options = {
      input: {
        alias: 'i',
        type: 'string',
        desc: 'Json file containing the command graph'
      }
    };
    processCommand.handler = this.processCommandJson.processJson.bind(this.processCommandJson);
    me.subCommands.push(processCommand);
  }
}

