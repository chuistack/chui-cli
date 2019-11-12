import {Command} from '@oclif/command';
import * as yaml from "js-yaml";
import {
  AuthProviders,
  ChuiConfigFile,
  InfrastructureProviders,
  ServerlessProviders,
  StorageProviders,
} from "@chuistack/chui-lib/dist/types/config";
import * as fs from "fs";
import {cli} from 'cli-ux';
import {promisify} from "util";
import {initializeProject} from "../../utils/project";
import * as inquirer from "inquirer";
import * as path from "path";
import {CHUI_CONFIG_FILENAME} from '@chuistack/chui-lib/dist/constants';
import * as dashify from "dashify";
import chalk from "chalk";
import * as validator from "validator";


const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);


/**
 * Generate the list of infrastructure providers.
 */
const getInfrastructureOptions = () => {
  const opts: { name: string, value?: any }[] = Object
    .values(InfrastructureProviders)
    .map(provider => ({
      name: provider as string
    }));
  opts.push({
    name: 'none',
    value: undefined,
  });
  return opts;
};


/**
 * Prompt the user for an infrastructure provider.
 */
const promptInfrastructure = async (): Promise<InfrastructureProviders | undefined> => {
  const {infrastructure} = await inquirer.prompt([{
    name: 'infrastructure',
    message: 'Select an infrastructure provider (or none).',
    type: 'list',
    choices: getInfrastructureOptions(),
  }]);
  return infrastructure;
};


/**
 * Prompt the user for an auth provider.
 */
const promptAuthProvider = async (): Promise<AuthProviders> => {
  const {authProvider} = await inquirer.prompt([{
    name: 'authProvider',
    message: 'Select an auth provider.',
    type: 'list',
    choices: Object.values(AuthProviders),
  }]);
  return authProvider;
};


/**
 * Prompt the user for a storage provider.
 */
const promptStorageProvider = async (): Promise<StorageProviders> => {
  const {storageProvider} = await inquirer.prompt([{
    name: 'storageProvider',
    message: 'Select a storage provider.',
    type: 'list',
    choices: Object.values(StorageProviders),
  }]);
  return storageProvider;
};


/**
 * Prompt the user for a storage provider.
 */
const promptServerlessProvider = async (): Promise<ServerlessProviders> => {
  const {serverlessProvider} = await inquirer.prompt([{
    name: 'serverlessProvider',
    message: 'Select a serverless provider.',
    type: 'list',
    choices: Object.values(ServerlessProviders),
  }]);
  return serverlessProvider;
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


interface PromptedConfig {
  globalAppName: string;
  rootDomain: string;
  pulumiOrgName: string;
  authProvider: AuthProviders;
  storageProvider: StorageProviders;
  serverlessProvider: ServerlessProviders;
  infrastructure?: InfrastructureProviders;
}


/**
 * Prompt for configuration options.
 */
const promptConfigOptions = async (): Promise<PromptedConfig> => {
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


/**
 * Get a full Chui json config from the options we prompted for.
 *
 * @param config
 */
const getJsonConfig = (config: PromptedConfig): ChuiConfigFile => {
  const {
    globalAppName,
    rootDomain,
    pulumiOrgName,
    infrastructure
  } = config;

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
      {environment: 'staging'},
      {environment: 'dev'},
    ],
  };

  if (infrastructure) {
    jsonConfig.globals.infrastructure = infrastructure;
  }

  return jsonConfig;
};


/**
 * Write the json config file to yaml.
 *
 * @param jsonConfig
 */
const writeYamlConfig = async (jsonConfig: ChuiConfigFile) => {
  const {globals: {globalAppName}} = jsonConfig;
  await mkdir(`./${globalAppName}`);
  const yamlConfig = yaml.safeDump(jsonConfig);
  await writeFile(path.join(
    '.',
    globalAppName,
    CHUI_CONFIG_FILENAME,
  ), yamlConfig);
};


export default class New extends Command {
  static description = 'Create a new Chui project.';

  async run() {
    const config = await promptConfigOptions();
    const jsonConfig = getJsonConfig(config);
    await writeYamlConfig(jsonConfig);

    const {globalAppName} = config;
    await initializeProject(`./${globalAppName}`);
    console.log(chalk.green("Done! Welcome to your new Chui project."))
  }
}
