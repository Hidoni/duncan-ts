import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
} from '@discordjs/builders';
import { ChatInputCommandInteraction, CommandInteraction } from 'discord.js';
import Bot from '../../../client/Bot';
import { CommandHandler } from '../../../interfaces/Command';
import { createLeaderboard } from '../../../utils/LeaderboardUtils';
import { getAllGimmickPoints } from '../GimmicksQueries';

export const leaderboard = createLeaderboard(
    { id: 'gimmicks', title: 'Gimmicks Leaderboard' },
    {
        valueColumnName: 'Points',
        fetch: () => getAllGimmickPoints(),
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
            `Unknown subcommand for Gimmicks Command: "${subcommand}"`
        );
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

export const shouldLoad = () => true;
