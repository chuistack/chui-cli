import {Command} from '@oclif/command';
import {initializeProject} from "../../utils/project";


export default class Initialize extends Command {
  static description = 'Initialize a new Chui project from a chui.yml file.';

  async run() {
    initializeProject('.');
  }
}
