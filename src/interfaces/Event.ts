import Bot from '../client/Bot';

export interface EventHandler {
    (client: Bot, ...args: any[]): Promise<void>;
}

export interface Event {
    name: string;
    once: boolean;
    handler: EventHandler;
}
