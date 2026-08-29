import { Module } from '../../interfaces/Module';
import * as RNGdleCommand from './commands/RNGdleCommand';
import * as RNGdleJob from './jobs/RNGdleJob';
import { RNGdleUsername } from './models/RNGdleUsernames';

const rngdleModule: Module = {
    name: 'rngdle',
    commands: [RNGdleCommand],
    jobs: [RNGdleJob],
    models: [RNGdleUsername],
};

export default rngdleModule;
