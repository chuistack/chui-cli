import {Command} from '@oclif/command';
import {
  AuthProviders,
  ChuiAppSource,
  ChuiAppTypes,
  ChuiPromptConfig,
  InfrastructureProviders,
  ServerlessProviders,
  StorageProviders,
} from "@chuistack/chui-lib/dist/types/config";
import {cli} from 'cli-ux';
import * as inquirer from "inquirer";
import Chui from '@chuistack/chui-lib/';
import * as dashify from "dashify";
import chalk from "chalk";
import * as validator from "validator";



/**
 * Creates a prompt for an app type based on the
 * official list of supported apps.
 * @param type
 * @param message
 * @param addNull
 */
const promptApp = async <T = string>(
  type: ChuiAppTypes,
  message: string,
  addNull?: boolean,
): Promise<T|undefined> => {
  const appList: ChuiAppSource[] = await Chui.App.loadOfficialAppList();
  const choices: any[] = appList
      .filter(app => app.type === type)
      .map(app => ({
        name: app.variant,
        value: app.variant,
      }));

  if(addNull){
    choices.push({
      name: 'none',
      value: undefined,
    })
  }

  const {option} = await inquirer.prompt([{
    message,
    choices,
    name: 'option',
    type: 'list',
  }]);

  return option;
};


/**
 * Prompt the user for an infrastructure provider.
 */
const promptInfrastructure = async (): Promise<InfrastructureProviders | undefined> => {
  return promptApp<InfrastructureProviders>(
    ChuiAppTypes.Infrastructure,
    'Select an infrastructure provider',
    true,
  );
};


/**
 * Prompt the user for an auth provider.
 */
const promptAuthProvider = async (): Promise<AuthProviders|undefined> => {
  return promptApp<AuthProviders>(
    ChuiAppTypes.Auth,
    'Select an auth provider (or none).',
    true,
  );
};


/**
 * Prompt the user for a storage provider.
 */
const promptStorageProvider = async (): Promise<StorageProviders|undefined> => {
  return promptApp<StorageProviders>(
    ChuiAppTypes.Storage,
    'Select a storage provider (or none).',
    true,
  );
};


/**
 * Prompt the user for a storage provider.
 */
const promptServerlessProvider = async (): Promise<ServerlessProviders|undefined> => {
  return promptApp<ServerlessProviders>(
    ChuiAppTypes.Serverless,
    'Select a serverless provider (or none).',
    true,
  );
};


/**
 * Get the global app name, kebab-cased.
 */
const promptGlobalAppName = async () => {
  const globalAppName = await cli.prompt(`What is the name of your project?`);
  const dashified = dashify(globalAppName);
  if (dashified !== globalAppName) {
    console.log(chalk.blue(`kebab-casing your app name to: ${dashified}`));
  }
  return dashified;
};


/**
 * Prompt for the root domain of the project.
 */
const promptRootDomain = async () => {
  let rootDomain;
  while (!rootDomain || !validator.isFQDN(rootDomain)) {
    if (!!rootDomain && !validator.isFQDN(rootDomain)) {
      console.warn(chalk.yellow('Please provide a valid domain.'));
    }
    rootDomain = await cli.prompt(`What will be the root domain for your project?`);
  }
  return rootDomain;
};


/**
 * Prompt for configuration options.
 */
const promptConfigOptions = async (): Promise<ChuiPromptConfig> => {
  const globalAppName = await promptGlobalAppName();
  const rootDomain = await promptRootDomain();
  const pulumiOrgName = await cli.prompt(`What is your Pulumi org name or username?`);
  const authProvider = await promptAuthProvider();
  const storageProvider = await promptStorageProvider();
  const serverlessProvider = await promptServerlessProvider();
  const infrastructure = await promptInfrastructure();
  return {
    globalAppName,
    rootDomain,
    pulumiOrgName,
    authProvider,
    storageProvider,
    serverlessProvider,
    infrastructure
  };
};


export default class New extends Command {
  static description = 'Create a new Chui project.';

  async run() {
    const config = await promptConfigOptions();
    Chui.Project.createNewProject(config);
  }
}
