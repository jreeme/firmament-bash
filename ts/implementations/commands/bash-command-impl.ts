import {injectable, inject} from "inversify";
import kernel from '../../inversify.config';
import {Command, CommandUtil, Spawn} from 'firmament-yargs';

@injectable()
export class BashCommandImpl implements Command {
  aliases: string[] = [];
  command: string = '';
  commandDesc: string = '';
  //noinspection JSUnusedGlobalSymbols
  //noinspection JSUnusedLocalSymbols
  handler: (argv: any)=>void = (argv: any) => {
  };
  options: any = {};
  subCommands: Command[] = [];
  private commandUtil: CommandUtil;
  private spawn: Spawn;

  constructor(@inject('CommandUtil') _commandUtil: CommandUtil,
              @inject('Spawn') _spawn: Spawn) {
    this.buildCommandTree();
    this.commandUtil = _commandUtil;
    this.spawn = _spawn;
  }

  private buildCommandTree() {
    this.aliases = ['bash'];
    this.command = '<subCommand>';
    this.commandDesc = 'Run bash commands described in JSON files';
    this.pushTestCommand();
  }

  private pushTestCommand() {
    let me = this;
    let testCommand = kernel.get<Command>('CommandImpl');
    testCommand.aliases = ['test'];
    testCommand.commandDesc = 'Test Command';
    //noinspection JSUnusedLocalSymbols
    testCommand.handler = (argv) => {
      var sudo = require('sudo');
      var options = {
        cachePassword: true,
        prompt: 'Password, yo? ',
        spawnOptions: {/* other options for spawn */}
      };
      var child = sudo(['ls', '-l', '/tmp'], options);
      child.stdout.on('data', function (data) {
        console.log(data.toString());
      });
      console.log('Test Hello!!');
    };
    me.subCommands.push(testCommand);
  }
}

