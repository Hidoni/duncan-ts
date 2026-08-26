import { Module } from '../../interfaces/Module';
import * as WordfieldCommand from './commands/WordfieldCommand';
import * as MessageCreateEvent from './events/MessageCreateEvent';
import * as MessageEditEvent from './events/MessageEditEvent';
import * as WeeklyReportJob from './jobs/WeeklyReportJob';
import { MessageCount } from './models/MessageCount';

const wordfieldModule: Module = {
    name: 'wordfield',
    commands: [WordfieldCommand],
    events: [MessageCreateEvent, MessageEditEvent],
    jobs: [WeeklyReportJob],
    models: [MessageCount],
};

export default wordfieldModule;
