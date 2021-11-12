import {
    ContextMenuCommandBuilder,
    SlashCommandBuilder,
} from '@discordjs/builders';
import {
    CommandInteraction,
    ContextMenuInteraction,
    PermissionString,
} from 'discord.js';
import Bot from '../client/Bot';

export type CommandBuilderType =
    | SlashCommandBuilder
    | ContextMenuCommandBuilder;
export type CommandInteractionType<Builder> =
    Builder extends SlashCommandBuilder
        ? CommandInteraction
        : ContextMenuInteraction;

export interface CommandHandler {
    (client: Bot, interaction: CommandInteraction): Promise<void>;
}
export interface ContextMenuHandler {
    (client: Bot, interaction: ContextMenuInteraction): Promise<void>;
}

export interface Command<Builder extends CommandBuilderType> {
    handler: Builder extends SlashCommandBuilder
        ? CommandHandler
        : ContextMenuHandler;
    builder: Builder;
    guildOnly:
        | ((interaction: CommandInteractionType<Builder>) => boolean)
        | undefined;
    permissions:
        | ((interaction: CommandInteractionType<Builder>) => PermissionString[])
        | undefined;
}
