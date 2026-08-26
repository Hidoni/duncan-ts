import { RecurrenceRule } from 'node-schedule';
import Bot from '../client/Bot';
import { Loadable } from './Loadable';

export interface ScheduledJobHandler {
    (client: Bot, fireDate: Date): Promise<void>;
}

export interface ScheduledJob extends Loadable {
    name: string;
    rule: RecurrenceRule;
    handler: ScheduledJobHandler;
}
