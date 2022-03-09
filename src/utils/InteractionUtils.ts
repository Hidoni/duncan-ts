import {
    CommandInteraction,
    ContextMenuInteraction,
    InteractionReplyOptions,
    MessageComponentInteraction,
    ModalSubmitInteraction,
} from 'discord.js';
import Bot from '../client/Bot';

export function getReplyFunction(
    interaction:
        | CommandInteraction
        | ContextMenuInteraction
        | MessageComponentInteraction
        | ModalSubmitInteraction
) {
    if (interaction.deferred && !interaction.replied) {
        return interaction.editReply.bind(interaction);
    }
    if (interaction.replied) {
        return interaction.followUp.bind(interaction);
    }
    return interaction.reply.bind(interaction);
}

export function getSafeReplyFunction(
    client: Bot,
    interaction:
        | CommandInteraction
        | ContextMenuInteraction
        | MessageComponentInteraction
        | ModalSubmitInteraction
) {
    return async (options: InteractionReplyOptions) => {
        try {
            await getReplyFunction(interaction)(options);
        } catch (error) {
            client.logger?.error(
                `Could not reply to interaction with id (${interaction.id}): ${error}`
            );
        }
    };
}
