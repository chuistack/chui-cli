import {Command} from "@oclif/command";
import {cli} from 'cli-ux';
import * as inquirer from "inquirer";
import { loadConfigFile } from '@chuistack/chui-lib/dist/config';
import { initializeEnvironment } from '@chuistack/chui-lib/dist/environment/initialize';
import { ChuiEnvConfig } from '@chuistack/chui-lib/dist/types/config';


export const _environmentPrompt = async () => {
  const environments = loadConfigFile().environments;
  return (await inquirer.prompt({
    name: 'env',
    type: 'list',
    choices: environments.map(env => ({
      name: env.environment,
      value: env,
    }))
  })).env;
};


export default class Initialize extends Command {
  static description = 'Initialize an environment.';

  async run() {
    const environment = await _environmentPrompt() as ChuiEnvConfig;
    await initializeEnvironment(environment.environment);
  }
}
