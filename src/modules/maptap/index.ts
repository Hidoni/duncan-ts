import { Module } from '../../interfaces/Module';
import * as MapTapCommand from './commands/MapTapCommand';
import * as MapTapLeaderboardComponentHandler from './component_handlers/MapTapLeaderboardComponentHandler';
import * as MapTapJob from './jobs/MapTapJob';
import * as MapTapScoreSubmissionModalHandler from './modal_handlers/MapTapScoreSubmissionModalHandler';
import { MapTapScore } from './models/MapTapScore';

const mapTapModule: Module = {
    name: 'maptap',
    commands: [MapTapCommand],
    jobs: [MapTapJob],
    componentHandlers: [MapTapLeaderboardComponentHandler],
    modalHandlers: [MapTapScoreSubmissionModalHandler],
    models: [MapTapScore],
};

export default mapTapModule;
