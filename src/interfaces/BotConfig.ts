import { Module } from './Module';
import { BitFieldResolvable, GatewayIntentsString, Partials } from 'discord.js';

export default interface BotConfig {
    intents: BitFieldResolvable<GatewayIntentsString, number>;
    token: string;
    appId: string;
    database: string;
    debugGuildId?: string;
    partials: Partials[];
    modules: Module[];
}
