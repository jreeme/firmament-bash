import {injectable, inject} from 'inversify';
import kernel from '../../inversify.config';
import {Command} from 'firmament-yargs';
import {ProcessCommandJson} from '../../interfaces/process-command-json';

@injectable()
export class BashCommandImpl implements Command {
  aliases: string[] = [];
  command: string = '';
  commandDesc: string = '';
  handler: (argv: any) => void = () => {
  };
  options: any = {};
  subCommands: Command[] = [];

  constructor(@inject('ProcessCommandJson') private processCommandJson: ProcessCommandJson) {
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
    processCommand.aliases = ['process', 'p'];
    processCommand.commandDesc = 'Execute bash command graph described in Json file';
    processCommand.options = {
      input: {
        alias: 'i',
        type: 'string',
        required: true,
        desc: 'Url to command graph or list available graphs if none specified'
      }
    };
    processCommand.handler = this.processCommandJson.processYargsCommand.bind(this.processCommandJson);
    me.subCommands.push(processCommand);
  }
}

