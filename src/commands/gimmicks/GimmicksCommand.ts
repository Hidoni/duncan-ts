import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
} from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import Bot from '../../client/Bot';
import { CommandHandler } from '../../interfaces/Command';
import {
    DEFAULT_EMBED_COLOR,
    generateLeaderboardComponentsRow,
    generateLeaderboardEmbed,
} from '../../utils/LeaderboardUtils';

async function handleLeaderboardSubcommand(
    client: Bot,
    interaction: CommandInteraction
): Promise<void> {
    const points = await client.database.getAllGimmickPoints();
    const leaderboardembed = generateLeaderboardEmbed(
        points,
        (value) => [value.id, value.points.toString()],
        1,
        {
            title: 'Gimmick Leaderboard',
            color: DEFAULT_EMBED_COLOR,
            keyName: 'User',
            valueName: 'Points',
        }
    );
    const leaderboardComponenetsRow = generateLeaderboardComponentsRow(
        points,
        1,
        `gimmicks_leaderboard_${interaction.user.id}`
    );
    await interaction.reply({
        embeds: [leaderboardembed],
        components: [leaderboardComponenetsRow],
    });
}

export const handler: CommandHandler = async (
    client: Bot,
    interaction: CommandInteraction
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

export const guildOnly = (interaction: CommandInteraction) => true;

export const permissions = (interaction: CommandInteraction) => false;
