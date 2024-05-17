import {
    ContextMenuCommandBuilder,
    SlashCommandBuilder,
} from '@discordjs/builders';
import {
    CommandInteraction,
    ContextMenuCommandInteraction,
    Interaction,
    InteractionReplyOptions,
    MessageComponentInteraction,
    ModalSubmitInteraction,
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
import { getSafeReplyFunction } from '../utils/InteractionUtils';

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
        getSafeReplyFunction(
            client,
            interaction
        )({
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
            getSafeReplyFunction(
                client,
                interaction
            )({
                content:
                    'What the..! The sprinkles spell out ‘404’! Not sure what happened there..',
                ephemeral: true,
            });
            client.logger?.error(
                `member field was null, could not perform required permission check in command ${interaction.commandName}`
            );
            return false;
        } else if (!hasPermissions(interaction.member, permissions)) {
            getSafeReplyFunction(
                client,
                interaction
            )({
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
    interaction: CommandInteraction | ContextMenuCommandInteraction
): Promise<void> {
    if (
        interaction.isContextMenuCommand() &&
        command.builder instanceof ContextMenuCommandBuilder
    ) {
        await (command as Command<ContextMenuCommandBuilder>).handler(
            client,
            interaction
        );
    } else if (
        interaction.isChatInputCommand() &&
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
    client.logger?.debug(
        `Received an interaction of type ${interaction.type}${
            interaction.isMessageComponent() || interaction.isModalSubmit()
                ? ` (${interaction.customId})`
                : ''
        }, id is ${interaction.id}, user is ${interaction.user.tag}${
            interaction.channel
                ? `, channel id is ${interaction.channel.id}`
                : ''
        }${
            interaction.guild
                ? `, guild is ${interaction.guild.name} (${interaction.guildId})`
                : ''
        }`
    );
    if (interaction.isCommand()) {
        const command = client.getCommand(interaction.commandName);
        if (command) {
            if (await canRunCommand(client, interaction, command)) {
                try {
                    await handleCommandCall(command, client, interaction);
                } catch (error) {
                    client.logger?.error(
                        `Got the following error while executing ${interaction.commandName} command (${interaction.id}): ${error}`
                    );
                    getSafeReplyFunction(
                        client,
                        interaction
                    )({
                        content: UNKNOWN_ERROR_MESSAGE,
                        ephemeral: true,
                    });
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
                    `Got the following error while handling a component with id ${interaction.customId} (${interaction.id}): ${error}`
                );
                getSafeReplyFunction(
                    client,
                    interaction
                )({
                    content: UNKNOWN_ERROR_MESSAGE,
                    ephemeral: true,
                });
            });
        } else {
            client.logger?.debug(
                `Ignoring unknown component with ID ${interaction.customId}`
            );
        }
    } else if (interaction.isModalSubmit()) {
        const modalHandler = client.getModalHandler(interaction.customId);
        if (modalHandler) {
            modalHandler.handler(client, interaction).catch((error) => {
                client.logger?.error(
                    `Got the following error while handling a modal with id ${interaction.customId} (${interaction.id}): ${error}`
                );
                getSafeReplyFunction(
                    client,
                    interaction
                )({
                    content: UNKNOWN_ERROR_MESSAGE,
                    ephemeral: true,
                });
            });
        } else {
            client.logger?.debug(
                `Ignoring unknown modal with ID ${interaction.customId} (${interaction.id})`
            );
        }
    } else {
        client.logger?.debug(
            `Ignoring unknown interaction of type: ${interaction.type} (${interaction.id})`
        );
    }
};
export const shouldLoad = () => true;
