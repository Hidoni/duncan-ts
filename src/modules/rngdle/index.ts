import { Module } from '../../interfaces/Module';
import * as RNGdleCommand from './commands/RNGdleCommand';
import * as RNGdleJob from './jobs/RNGdleJob';
import { RNGdleRoll } from './models/RNGdleRoll';
import { RNGdleUsername } from './models/RNGdleUsernames';

const rngdleModule: Module = {
    name: 'rngdle',
    commands: [RNGdleCommand],
    componentHandlers: [RNGdleCommand.leaderboard.componentHandler],
    jobs: [RNGdleJob],
    models: [RNGdleUsername, RNGdleRoll],
};

export default rngdleModule;
