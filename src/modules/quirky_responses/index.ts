import { Module } from '../../interfaces/Module';
import * as MessageEvent from './events/MessageEvent';

const quirkyResponsesModule: Module = {
    name: 'quirky_responses',
    events: [MessageEvent],
};

export default quirkyResponsesModule;
