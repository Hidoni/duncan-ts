import {
    ContextMenuCommandBuilder,
    SlashCommandBuilder,
} from '@discordjs/builders';
import {
    CommandInteraction,
    ContextMenuInteraction,
    Interaction,
    Snowflake,
} from 'discord.js';
import Bot from '../client/Bot';
import {
    Command,
    CommandBuilderType,
    CommandInteractionType,
} from '../interfaces/Command';
import { EventHandler } from '../interfaces/Event';
import { hasPermissions, isUserAdmin } from '../utils/PermissionUtils';

const UNKNOWN_ERROR_MESSAGE =
    'Aw heck! Something went wrong here and I dunno what it is! ;w; Let’s go ask Hidoni about it!';

async function canRunCommand(
    client: Bot,
    interaction: CommandInteractionType<CommandBuilderType>,
    command: Command<CommandBuilderType>
): Promise<boolean> {
    if (
        command.guildOnly &&
        command.guildOnly(interaction) &&
        !interaction.guild
    ) {
        interaction.reply({
            content:
                'Oh wait! Send that command to me in the server instead! It gets covered in chocolate and sprinkles here in our messages so I don’t really see it! ',
            ephemeral: true,
        });
        return false;
    } else if (
        !isUserAdmin(interaction.user.id) &&
        command.permissions &&
        command.permissions(interaction)
    ) {
        const permissions = command.permissions(interaction);
        if (!interaction.member) {
            interaction.reply({
                content:
                    'What the..! The sprinkles spell out ‘404’! Not sure what happened there..',
                ephemeral: true,
            });
            client.logger?.error(
                `member field was null, could not perform required permission check in command ${interaction.commandName}`
            );
            return false;
        } else if (!hasPermissions(interaction.member, permissions)) {
            interaction.reply({
                content: `Uh oh… you’re not allowed to do that! I think you might need the following permission${
                    permissions.length > 1 ? '(s)' : ''
                }: ${permissions.join(', ')}`,
                ephemeral: true,
            });
            return false;
        }
    }
    return true;
}

async function handleCommandCall(
    command: Command<CommandBuilderType>,
    client: Bot,
    interaction: CommandInteraction | ContextMenuInteraction
): Promise<void> {
    if (
        interaction.isContextMenu() &&
        command.builder instanceof ContextMenuCommandBuilder
    ) {
        await (command as Command<ContextMenuCommandBuilder>).handler(
            client,
            interaction
        );
    } else if (
        interaction.isCommand() &&
        command.builder instanceof SlashCommandBuilder
    ) {
        await (command as Command<SlashCommandBuilder>).handler(
            client,
            interaction
        );
    } else {
        throw new Error(
            `Mismatch between interaction type and command type in command ${command.builder.name}`
        );
    }
}

export const name: string = 'interactionCreate';
export const handler: EventHandler = async (
    client: Bot,
    interaction: Interaction
) => {
    if (interaction.isCommand() || interaction.isContextMenu()) {
        const command = client.getCommand(interaction.commandName);
        if (command) {
            if (await canRunCommand(client, interaction, command)) {
                try {
                    await handleCommandCall(command, client, interaction);
                } catch (error) {
                    client.logger?.error(
                        `Got the following error while executing ${interaction.commandName} command: ${error}`
                    );
                    const replyFunction = interaction.replied
                        ? interaction.followUp.bind(interaction)
                        : interaction.reply.bind(interaction);
                    replyFunction({
                        content: UNKNOWN_ERROR_MESSAGE,
                        ephemeral: true,
                    }).catch(() =>
                        client.logger?.debug('Could not reply to interaction')
                    );
                }
            }
        } else {
            client.logger?.debug(
                `Ignoring unknown command with name ${interaction.commandName}`
            );
        }
    } else if (interaction.isMessageComponent()) {
        const componentHandler = client.getComponentHandler(
            interaction.customId
        );
        if (componentHandler) {
            componentHandler.handler(client, interaction).catch((error) => {
                client.logger?.error(
                    `Got the following error while handling a component with id ${interaction.customId}: ${error}`
                );
                const replyFunction = interaction.replied
                    ? interaction.followUp.bind(interaction)
                    : interaction.reply.bind(interaction);
                replyFunction({
                    content: UNKNOWN_ERROR_MESSAGE,
                    ephemeral: true,
                });
            });
        } else {
            client.logger?.debug(
                `Ignoring unknown component with ID ${interaction.customId}`
            );
        }
    } else {
        client.logger?.debug(
            `Ignoring unknown interaction of type: ${interaction.type}`
        );
    }
};
export const shoudLoad = () => true;
