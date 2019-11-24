import {Command, flags} from "@oclif/command";
import Chui from '@chuistack/chui-lib';
import * as inquirer from "inquirer";
import chalk from "chalk";
import {ChuiAppSource} from '@chuistack/chui-lib/dist/types/config';
import * as fuzzy from "fuzzy";
import { cli } from 'cli-ux';


inquirer.registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));


/**
 * Prep/colourize the results.
 * @param result
 * @private
 */
export const _processFuzzyResult = (result: any) => {
  let name = result.string.replace(/{([a-zA-Z0-9_\-]*)}/g, chalk.blue('$1'));
  name = name.replace('{', '').replace('}', '');
  return {
    ...result.original,
    name,
  };
};


/**
 * Loads app list from GitHub and formats choices for inquirer.
 * @private
 */
export const _loadChoices = async () => {
  const appList: ChuiAppSource[] = await Chui.App.loadOfficialAppList();
  return appList.map(_app => ({
    name: `${_app.type} - ${_app.variant || ''}`,
    value: _app,
  }));
};


/**
 * Generate the source list for the prompt.
 * @param _
 * @param input
 * @private
 */
export const _appSource = async (_: any, input: string) => {
  const choices = await _loadChoices();

  if (!input)
    return choices;

  return fuzzy.filter(input, choices, {
    pre: '{',
    post: '}',
    extract: (el: { name: string }) => el.name,
  }).map(_processFuzzyResult);

};


/**
 * Prompt to select an app from the official list.
 */
export const appPrompt = async (): Promise<ChuiAppSource> => {
  return (await inquirer.prompt([{
    name: 'app',
    type: 'autocomplete',
    message: 'Select an app from the list',
    source: _appSource,
  }])).app;
};


export default class Add extends Command {
  static description = 'Add an app to an existing Chui project.';

  static flags = {
    name: flags.string({required: false}),
    source: flags.string({required: false}),
  };

  async run() {
    const {flags} = this.parse(Add);
    let {name, source} = flags;

    if (name && source) {
      Chui.App.addApp({name, source});
    }

    const app = await appPrompt();
    name = await cli.prompt(`What will be the app's name?`, {required: true}) as string;

    Chui.App.addApp({...app, name});
  }
}
