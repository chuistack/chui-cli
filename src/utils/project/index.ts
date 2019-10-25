import * as Git from "nodegit";
import * as Chui from "@chuistack/chui-lib";
import {ChuiApp, ChuiGlobalConfig} from '@chuistack/chui-lib/dist/types/config';
import {
  CHUI_APP_CONFIG_DIR,
  CHUI_APP_PULUMI_CONFIG_FILENAME,
} from '@chuistack/chui-lib/dist/constants';
import * as path from "path";
import * as fs from "fs";
import {promisify} from "util";


const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);


/**
 * Prepare the app, once it's cloned.
 *
 * @param config
 * @param app
 * @param root
 */
const prepApp = async (config: ChuiGlobalConfig, app: ChuiApp, root: string) => {
  let sampleConfig = await readFile(path.join(
    root,
    app.directory,
    CHUI_APP_CONFIG_DIR,
    CHUI_APP_PULUMI_CONFIG_FILENAME,
  ), "utf8");

  sampleConfig = sampleConfig.replace(/{{globalAppName}}/g, config.globalAppName);
  sampleConfig = sampleConfig.replace(/{{application}}/g, app.directory);

  await writeFile(path.join(
    root,
    app.directory,
    CHUI_APP_CONFIG_DIR,
    'Pulumi.yaml'
  ), sampleConfig);
};


/**
 * Initialize the apps in the config (i.e. clone them and prep their Pulumi configs)
 *
 * @param config
 * @param root
 */
const initializeApps = async (config: ChuiGlobalConfig, root: string) => {
  const {apps = []} = config;

  const clonePromises = apps.map(app => {
    return Git.Clone.clone(app.repo, path.join(root, app.directory));
  });

  await Promise.all(clonePromises);

  const configPromises = apps.map(app => prepApp(config, app, root));

  await Promise.all(configPromises);
};


/**
 *
 * @param cwd
 */
export const initializeProject = async (cwd: string) => {
  const config = Chui.Config.loadGlobalConfig(cwd);
  config.apps && await initializeApps(config, cwd);
};
