import {
    ContextMenuCommandBuilder,
    SlashCommandBuilder,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandsOnlyBuilder,
} from '@discordjs/builders';
import {
    ChatInputCommandInteraction,
    CommandInteraction,
    ContextMenuCommandInteraction,
    PermissionsString,
} from 'discord.js';
import Bot from '../client/Bot';
import { Loadable } from './Loadable';

export type SlashCommandBuilderType =
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
export type CommandBuilderType =
    SlashCommandBuilderType | ContextMenuCommandBuilder;
export type CommandInteractionType<Builder> =
    Builder extends ContextMenuCommandBuilder
        ? ContextMenuCommandInteraction
        : ChatInputCommandInteraction;

export interface CommandHandler {
    (client: Bot, interaction: ChatInputCommandInteraction): Promise<void>;
}
export interface ContextMenuHandler {
    (client: Bot, interaction: ContextMenuCommandInteraction): Promise<void>;
}

export interface Command<Builder extends CommandBuilderType> extends Loadable {
    handler: Builder extends ContextMenuCommandBuilder
        ? ContextMenuHandler
        : CommandHandler;
    builder: Builder;
    guildOnly?: (interaction: CommandInteraction) => boolean | undefined;
    permissions?: (
        interaction: CommandInteraction
    ) => PermissionsString[] | undefined;
}
