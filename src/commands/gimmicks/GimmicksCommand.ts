import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
} from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import Bot from '../../client/Bot';
import { GimmickPoints } from '../../database/models/GimmickPoints';
import { CommandHandler } from '../../interfaces/Command';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';
import {
    DEFAULT_EMBED_COLOR,
    EmbedAttributes,
    generateLeaderboardComponentsRow,
    generateLeaderboardEmbed,
    LeaderboardMap,
} from '../../utils/LeaderboardUtils';

export const leaderboardEmbedAttributes: EmbedAttributes = {
    title: 'Gimmicks Leaderboard',
    color: DEFAULT_EMBED_COLOR,
    keyName: 'User',
    valueName: 'Points',
};
export const leaderboardMappingFunction: LeaderboardMap<
    GimmickPoints
> = (value) => [`<@${value.id}>`, value.points.toString()];

async function handleLeaderboardSubcommand(
    client: Bot,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const points = await client.database.getAllGimmickPoints();
    const leaderboardembed = generateLeaderboardEmbed(
        points,
        leaderboardMappingFunction,
        1,
        leaderboardEmbedAttributes
    );
    const leaderboardComponenetsRow = generateLeaderboardComponentsRow(
        points,
        1,
        `gimmicks_leaderboard_${interaction.user.id}`
    );
    await getSafeReplyFunction(client, interaction)({
        embeds: [leaderboardembed],
        components: [leaderboardComponenetsRow],
    });
}

export const handler: CommandHandler = async (
    client: Bot,
    interaction: ChatInputCommandInteraction
) => {
    const subcommand = interaction.options.getSubcommand(false);
    if (subcommand) {
        if (subcommand === 'leaderboard') {
            await handleLeaderboardSubcommand(client, interaction);
        } else {
            throw new Error(
                `Unknown subcommand for Gimmicks Command: "${subcommand}"`
            );
        }
    } else {
        throw new Error('No subcommand was given for Gimmicks Command');
    }
};
export const builder = new SlashCommandBuilder()
    .setName('gimmicks')
    .setDescription('Various functions related to Gimmicks!')
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('leaderboard')
            .setDescription('Shows the leaderboard for the gimmick channels!')
    );

export const guildOnly = (interaction: ChatInputCommandInteraction) => true;

export const permissions = (interaction: ChatInputCommandInteraction) => false;

export const shouldLoad = () => true;
