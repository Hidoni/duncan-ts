import { ModalSubmitInteraction } from 'discord.js';
import Bot from '../client/Bot';
import { Loadable } from './Loadable';

export interface ModalHandlerFunction {
    (client: Bot, interaction: ModalSubmitInteraction): Promise<void>;
}

export interface ModalHandler extends Loadable {
    handler: ModalHandlerFunction;
    pattern: RegExp;
}
