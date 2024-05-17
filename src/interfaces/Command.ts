import {
    ContextMenuCommandBuilder,
    SlashCommandBuilder,
} from '@discordjs/builders';
import {
    ChatInputCommandInteraction,
    CommandInteraction,
    ContextMenuCommandInteraction,
    PermissionsString,
} from 'discord.js';
import Bot from '../client/Bot';
import { Loadable } from './Loadable';

export type CommandBuilderType =
    | SlashCommandBuilder
    | ContextMenuCommandBuilder;
export type CommandInteractionType<Builder> =
    Builder extends SlashCommandBuilder
        ? ChatInputCommandInteraction
        : ContextMenuCommandInteraction;

export interface CommandHandler {
    (client: Bot, interaction: ChatInputCommandInteraction): Promise<void>;
}
export interface ContextMenuHandler {
    (client: Bot, interaction: ContextMenuCommandInteraction): Promise<void>;
}

export interface Command<Builder extends CommandBuilderType> extends Loadable {
    handler: Builder extends SlashCommandBuilder
        ? CommandHandler
        : ContextMenuHandler;
    builder: Builder;
    guildOnly:
        | ((interaction: CommandInteractionType<Builder>) => boolean)
        | undefined;
    permissions:
        | ((interaction: CommandInteractionType<Builder>) => PermissionsString[])
        | undefined;
}
