import {Command} from '@oclif/command';
import * as yaml from "js-yaml";
import {
  AuthProviders,
  ChuiConfigFile,
  InfrastructureProviders,
  StorageProviders,
  ServerlessProviders,
} from "@chuistack/chui-lib/dist/types/config";
import * as fs from "fs";
import {cli} from 'cli-ux';
import {promisify} from "util";
import {initializeProject} from "../../utils/project";
import * as inquirer from "inquirer";
import * as path from "path";
import {CHUI_CONFIG_FILENAME} from '@chuistack/chui-lib/dist/constants';
import {ListQuestionOptions} from "inquirer";


const mkdir = promisify(fs.mkdir);


/**
 * Generate the list of infrastructure providers.
 */
const getInfrastructureOptions = () => {
  const opts: {name: string, value?: any}[] = Object
    .values(InfrastructureProviders)
    .map(provider => ({
      name: provider as string
    }));
  opts.push({
    name: 'none',
    value: null,
  });
  return opts;
};


export default class New extends Command {
  static description = 'Create a new Chui project.';

  async run() {
    const globalAppName = await cli.prompt(`What is the kebab-cased-name of your project?`);
    const rootDomain = await cli.prompt(`What will be the root domain for your project?`);
    const pulumiOrgName = await cli.prompt(`What is your Pulumi org name or username?`);
    let {infrastructure} = await inquirer.prompt([{
      name: 'infrastructure',
      message: 'Select an infrastructure provider (or none).',
      type: 'list',
      choices: getInfrastructureOptions(),
    }]);

    const jsonConfig: ChuiConfigFile = {
      version: "0.1.0",
      globals: {
        globalAppName,
        rootDomain,
        pulumiOrgName,
        auth: AuthProviders.KeyCloak,
        storage: StorageProviders.Minio,
        serverless: ServerlessProviders.OpenFaas,
        apps: []
      },
      environments: [
        {
          environment: 'production',
          environmentDomain: rootDomain,
        },
        {
          environment: 'staging',
        },
        {
          environment: 'dev',
        }
      ],
    };

    if (infrastructure) {
      jsonConfig.globals.infrastructure = infrastructure;
    }

    await mkdir(`./${globalAppName}`);
    const config = yaml.safeDump(jsonConfig);
    fs.writeFileSync(path.join(
      '.',
      globalAppName,
      CHUI_CONFIG_FILENAME,
    ), config);
    initializeProject(`./${globalAppName}`);
  }
}
