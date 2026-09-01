import { Module } from '../../interfaces/Module';
import * as BrowniePointsCommands from './commands/BrowniePointsCommands';
import { BrowniePoints } from './models/BrowniePoints';

const browniePointsModule: Module = {
    name: 'brownie_points',
    commands: [BrowniePointsCommands],
    componentHandlers: [BrowniePointsCommands.leaderboard.componentHandler],
    models: [BrowniePoints],
};

export default browniePointsModule;
