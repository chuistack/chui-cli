import {Command, flags} from '@oclif/command';
import {Config, Constants} from "@chuistack/chui-lib";
import chalk from "chalk";

export default class Index extends Command {
  static description = 'Work with the Chui configuration.';

  static flags = {
    "environment": flags.string({multiple: false, required: false}),
  };

  async run() {
    const configFile = Config.getConfigFile();
    const {flags} = this.parse(Index);
    const {environment} = flags;

    if (configFile) {
      this.log(chalk.green("Config file found!"));
      this.log(chalk.blue(configFile));

      if (!environment) {
        console.log(Config.loadFullConfig());
      } else {
        process.env[Constants.CHUI_ENVIRONMENT_VARIABLE] = environment;
        console.log(Config.loadCurrentConfig());
      }

    } else {
      this.warn(chalk.yellow("No config file yet."));
      this.log("Try running chui-cli config:sample");
    }
  }
}
