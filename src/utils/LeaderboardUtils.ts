import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';

export const DEFAULT_EMBED_COLOR: readonly [number, number, number] = [251, 177, 189];

export interface EmbedAttributes {
    title: string;
    color: readonly [number, number, number];
    keyName: string;
    valueName: string;
}

export function generateLeaderboardEmbed<T>(
    leaderboard: T[],
    valueMap: (value: T) => readonly [string, string],
    page: number,
    embedAttributes: EmbedAttributes
): MessageEmbed {
    const pageCount = Math.ceil(leaderboard.length / 10);
    if (page <= 0) {
        throw new Error('Leaderboard page number must be 1 or higher');
    } else if (page > pageCount) {
        throw new Error(
            `Leaderboard page number exceeds amount of pages (${pageCount})`
        );
    }
    const selectedPage = leaderboard.slice((page - 1) * 10, page * 10);
    const { 0: keyRows, 1: valueRows } = selectedPage.reduce(
        (strings, entry, index) => {
            const [key, value] = valueMap(entry);
            return [
                strings[0] + `${index + 1}. ${key}\n`,
                strings[1] + `${value}\n`,
            ];
        },
        ['', '']
    );
    return new MessageEmbed()
        .setTitle(embedAttributes.title)
        .setFooter({ text: `Page ${page} of ${pageCount}` })
        .setColor(embedAttributes.color)
        .addFields(
            {
                name: embedAttributes.keyName,
                value: keyRows,
                inline: true,
            },
            { name: embedAttributes.valueName, value: valueRows, inline: true }
        );
}

export function generateLeaderboardComponentsRow<T>(
    leaderboard: T[],
    page: number,
    customId: string
): MessageActionRow {
    const pageCount = Math.ceil(leaderboard.length / 10);
    if (page <= 0) {
        throw new Error('Leaderboard page number must be 1 or higher');
    } else if (page > pageCount) {
        throw new Error(
            `Leaderboard page number exceeds amount of pages (${pageCount})`
        );
    }
    return new MessageActionRow().addComponents(
        new MessageButton()
            .setEmoji('⏮')
            .setStyle('PRIMARY')
            .setCustomId(`${customId}_FIRST`)
            .setDisabled(page === 1),
        new MessageButton()
            .setEmoji('◀')
            .setStyle('PRIMARY')
            .setCustomId(`${customId}_${page - 1}`)
            .setDisabled(page === 1),
        new MessageButton()
            .setEmoji('▶')
            .setStyle('PRIMARY')
            .setCustomId(`${customId}_${page + 1}`)
            .setDisabled(page === pageCount),
        new MessageButton()
            .setEmoji('⏭')
            .setStyle('PRIMARY')
            .setCustomId(`${customId}_LAST`)
            .setDisabled(page === pageCount)
    );
}
