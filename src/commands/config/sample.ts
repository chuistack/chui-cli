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


export default class Sample extends Command {
  static description = 'Generate a sample Chui configuration file in the current directory.';

  async run() {
    const jsonSample: ChuiConfigFile = {
      version: "0.1.0",
      globals: {
        rootDomain: 'chuistack.com',
        globalAppName: 'chui',
        infrastructure: InfrastructureProviders.DigitalOcean,
        auth: AuthProviders.KeyCloak,
        storage: StorageProviders.Minio,
        serverless: ServerlessProviders.OpenFaas,
        pulumiOrgName: 'chui-org',
        apps: []
      },
      environments: [
        {
          environment: 'production',
          environmentDomain: 'chuistack.com',
        },
        {
          environment: 'staging',
        },
        {
          environment: 'dev',
        }
      ],
    };
    const config = yaml.safeDump(jsonSample);
    const file = fs.openSync('./chui.yml', 'w');
    fs.writeSync(file, config);
    fs.closeSync(file);
  }
}
