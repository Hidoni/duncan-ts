import { Job } from 'node-schedule';
import { ModelCtor } from 'sequelize-typescript';
import { Command, CommandBuilderType } from './Command';
import { ComponentHandler } from './ComponentHandler';
import { Event } from './Event';
import { ModalHandler } from './ModalHandler';
import { ScheduledJob } from './ScheduledJob';

export interface Module {
    name: string;
    commands?: Command<CommandBuilderType>[];
    events?: Event[];
    componentHandlers?: ComponentHandler[];
    modalHandlers?: ModalHandler[];
    jobs?: ScheduledJob[];
    models?: ModelCtor[];
}

export interface RegisteredEvent {
    name: string;
    listener: (...args: any[]) => void;
}

export interface LoadedModule {
    module: Module;
    commands: Command<CommandBuilderType>[];
    events: RegisteredEvent[];
    componentHandlers: ComponentHandler[];
    modalHandlers: ModalHandler[];
    jobs: ScheduledJob[];
    scheduledJobs: Job[];
}
