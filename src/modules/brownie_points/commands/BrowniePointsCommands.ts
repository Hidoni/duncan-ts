import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
} from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import Bot from '../../../client/Bot';
import { CommandHandler } from '../../../interfaces/Command';
import { createLeaderboard } from '../../../utils/LeaderboardUtils';
import { getAllBrowniePoints } from '../BrowniePointsQueries';

export const leaderboard = createLeaderboard(
    { id: 'brownie_points', title: 'Brownie Points Leaderboard' },
    {
        valueColumnName: 'Points',
        fetch: () => getAllBrowniePoints(),
        mapEntry: (points) => [`<@${points.id}>`, points.points.toString()],
    }
);

export const handler: CommandHandler = async (
    client: Bot,
    interaction: ChatInputCommandInteraction
) => {
    const subcommand = interaction.options.getSubcommand(false);
    if (subcommand === 'leaderboard') {
        await leaderboard.reply(client, interaction);
    } else if (subcommand) {
        throw new Error(
            `Unknown subcommand for Brownie Points Command: "${subcommand}"`
        );
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

export const guildOnly = (interaction: CommandInteraction) => true;

export const shouldLoad = () => true;
