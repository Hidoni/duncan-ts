import {
    CommandInteraction,
    ContextMenuCommandInteraction,
    Guild,
    InteractionEditReplyOptions,
    InteractionReplyOptions,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    Snowflake,
} from 'discord.js';
import Bot from '../client/Bot';

export async function getRandomUserToMentionInGuild(
    guild: Guild,
    excluded: Snowflake[] | null,
    fetchGuildMembers: boolean = true
) {
    const guildMembers = Array.from(
        guild.members.cache
            .filter((member) => !excluded || excluded.indexOf(member.id) == -1)
            .values()
    );
    if (guildMembers.length === 0) {
        if (fetchGuildMembers) {
            await guild.members.fetch();
            return getRandomUserToMentionInGuild(guild, excluded, false);
        }
        throw Error('Server is too small to get another member!');
    }
    return guildMembers[Math.floor(Math.random() * guildMembers.length)];
}

export function getReplyFunction(
    interaction:
        | CommandInteraction
        | ContextMenuCommandInteraction
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
        | ContextMenuCommandInteraction
        | MessageComponentInteraction
        | ModalSubmitInteraction
) {
    return async (
        options: InteractionReplyOptions & InteractionEditReplyOptions
    ) => {
        try {
            await getReplyFunction(interaction)(options);
        } catch (error) {
            client.logger?.error(
                `Could not reply to interaction with id (${interaction.id}): ${error}`
            );
        }
    };
}
