import { MessageComponentInteraction } from 'discord.js';
import Bot from '../client/Bot';
import { Loadable } from './Loadable';

export interface ComponentHandlerFunction {
    (client: Bot, interaction: MessageComponentInteraction): Promise<void>;
}

export interface ComponentHandler extends Loadable {
    handler: ComponentHandlerFunction;
    pattern: RegExp;
}
