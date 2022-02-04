import Bot from '../client/Bot';
import { Loadable } from './Loadable';

export interface EventHandler {
    (client: Bot, ...args: any[]): Promise<void>;
}

export interface Event extends Loadable {
    name: string;
    once: boolean;
    handler: EventHandler;
}
