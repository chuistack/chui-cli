import {Command, flags} from '@oclif/command';
import cli from 'cli-ux';

export default class Global extends Command {
  static description = 'work with a chui configuration';

  static examples = [];

  static flags = {
    create: flags.boolean(),
  };

  static args = [{name: 'file'}];

  public async create() {
    const environment = await cli.prompt("Environment name? (i.e. production, staging, dev, etc.)");
    const globalAppName = await cli.prompt("Global app name? (used to prefix resource names)");
    const rootDomain = await cli.prompt("Root domain? (i.e. chuistack.com, or staging.chuistack.com)");
    console.log({
      environment,
      globalAppName,
      rootDomain,
    });
  }

  async run() {
    const {flags} = this.parse(Global);
    const {create} = flags;

    if (create) {
      return this.create();
    }
  }
}
