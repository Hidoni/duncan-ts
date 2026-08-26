import { Module } from '../../interfaces/Module';
import * as ChompCommand from './commands/ChompCommand';
import * as HugCommand from './commands/HugCommand';
import * as LickCommand from './commands/LickCommand';
import * as PetCommand from './commands/PetCommand';
import * as MigrationReadyEvent from './events/MigrationReadyEvent';
import { CommandUsage } from './models/CommandUsage';

const interactsModule: Module = {
    name: 'interacts',
    commands: [ChompCommand, HugCommand, LickCommand, PetCommand],
    events: [MigrationReadyEvent],
    models: [CommandUsage],
};

export default interactsModule;
