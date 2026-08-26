import { Module } from '../../interfaces/Module';
import * as NameCommand from './commands/NameCommand';
import * as SendCommand from './commands/SendCommand';
import * as InteractionCreateEvent from './events/InteractionCreateEvent';
import * as ReadyEvent from './events/ReadyEvent';
import { Name } from './models/Name';

const coreModule: Module = {
    name: 'core',
    commands: [NameCommand, SendCommand],
    events: [InteractionCreateEvent, ReadyEvent],
    models: [Name],
};

export default coreModule;
