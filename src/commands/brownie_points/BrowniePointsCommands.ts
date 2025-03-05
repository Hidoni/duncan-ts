import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
} from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import Bot from '../../client/Bot';
import { CommandHandler } from '../../interfaces/Command';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';
import {
    DEFAULT_EMBED_COLOR,
    EmbedAttributes,
    generateLeaderboardComponentsRow,
    generateLeaderboardEmbed,
    LeaderboardMap,
} from '../../utils/LeaderboardUtils';
import { BrowniePoints } from '../../database/models/BrowniePoints';

export const leaderboardEmbedAttributes: EmbedAttributes = {
    title: 'Brownie Points Leaderboard',
    color: DEFAULT_EMBED_COLOR,
    keyName: 'User',
    valueName: 'Points',
};
export const leaderboardMappingFunction: LeaderboardMap<
    BrowniePoints
> = (value) => [`<@${value.id}>`, value.points.toString()];

async function handleLeaderboardSubcommand(
    client: Bot,
    interaction: ChatInputCommandInteraction
): Promise<void> {
    const points = await client.database.getAllBrowniePoints();
    const leaderboardembed = generateLeaderboardEmbed(
        points,
        leaderboardMappingFunction,
        1,
        leaderboardEmbedAttributes
    );
    const leaderboardComponenetsRow = generateLeaderboardComponentsRow(
        points,
        1,
        `brownie_points_leaderboard_${interaction.user.id}`
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
                `Unknown subcommand for Brownie Points Command: "${subcommand}"`
            );
        }
    } else {
        throw new Error('No subcommand was given for Brownie Points Command');
    }
};
export const builder = new SlashCommandBuilder()
    .setName('brownies')
    .setDescription('Various functions related to Brownie Points!')
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('leaderboard')
            .setDescription('Shows the leaderboard for brownie points!')
    );

export const guildOnly = (interaction: ChatInputCommandInteraction) => true;

export const permissions = (interaction: ChatInputCommandInteraction) => false;

export const shouldLoad = () => true;
