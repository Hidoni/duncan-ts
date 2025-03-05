import {
    CommandInteraction,
    ContextMenuCommandInteraction,
    Guild,
    InteractionReplyOptions,
    MessageComponentInteraction,
    ModalSubmitInteraction,
    Snowflake,
} from 'discord.js';
import Bot from '../client/Bot';

export async function getUserPreferredName(
    client: Bot,
    user: Snowflake,
    guild: Guild
) {
    const name = await client.database.getName(user);
    if (name) {
        return name;
    }
    const guildUser = await guild.members.fetch(user);
    const nickname = guildUser.nickname;
    if (nickname) {
        return nickname;
    }
    return guildUser.displayName;
}

export async function getRandomUserToMentionInGuild(
    guild: Guild,
    excluded: Snowflake[] | null
) {
    const guildMembers = Array.from(
        (await guild.members.fetch())
            .filter((member) => !excluded || excluded.indexOf(member.id) == -1)
            .values()
    );
    if (guildMembers.length === 0) {
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
