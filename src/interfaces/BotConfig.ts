import { BitFieldResolvable, IntentsString, PartialTypes } from 'discord.js';

export default interface BotConfig {
    intents: BitFieldResolvable<IntentsString, number>;
    token: string;
    appId: string;
    debugGuildId?: string;
    partials?: PartialTypes[];
    commandsFolder?: string;
    eventsFolder?: string;
    componentHandlersFolder?: string;
}
