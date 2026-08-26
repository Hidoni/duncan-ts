import { Module } from '../../interfaces/Module';
import * as BrowniePointsCommands from './commands/BrowniePointsCommands';
import * as BrowniePointsLeaderboardComponentHandler from './component_handlers/BrowniePointsLeaderboardComponentHandler';
import { BrowniePoints } from './models/BrowniePoints';

const browniePointsModule: Module = {
    name: 'brownie_points',
    commands: [BrowniePointsCommands],
    componentHandlers: [BrowniePointsLeaderboardComponentHandler],
    models: [BrowniePoints],
};

export default browniePointsModule;
