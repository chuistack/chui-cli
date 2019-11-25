import {Command, flags} from "@oclif/command";
import Chui from '@chuistack/chui-lib';
import {cli} from 'cli-ux';
import * as dashify from "dashify";
import * as validator from "validator";


export const _domainPrompt = async () => {
  return cli.prompt(
    'Environment domain? (leave blank if unnecessary)', {required: false}
  );
};


export default class Add extends Command {
  static description = 'Add an environment to an existing Chui project.';

  static flags = {
    name: flags.string({required: false}),
    domain: flags.string({required: false}),
  };

  async run() {
    const {flags} = this.parse(Add);
    let {name, domain} = flags;
    let _domain: string | undefined = domain;

    if (name) {
      name = dashify(name);
      return await Chui.Environment.addEnvironmentToConfig(name, _domain);
    }

    name = await cli.prompt('Environment name?', {required: true}) as string;
    name = dashify(name);

    _domain = await _domainPrompt();

    if (_domain) {
      while (_domain && !validator.isFQDN(_domain)) {
        _domain = await _domainPrompt();
      }
    }

    return await Chui.Environment.addEnvironmentToConfig(name, _domain);
  }
}
