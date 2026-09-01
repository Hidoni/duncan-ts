import { Module } from '../../interfaces/Module';
import * as GimmicksCommand from './commands/GimmicksCommand';
import * as MessageEvent from './events/MessageEvent';
import { GimmickPoints } from './models/GimmickPoints';

const gimmicksModule: Module = {
    name: 'gimmicks',
    commands: [GimmicksCommand],
    events: [MessageEvent],
    componentHandlers: [GimmicksCommand.leaderboard.componentHandler],
    models: [GimmickPoints],
};

export default gimmicksModule;
