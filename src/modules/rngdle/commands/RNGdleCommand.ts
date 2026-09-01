import {
    ChatInputCommandInteraction,
    CommandInteraction,
    PermissionsString,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    SlashCommandUserOption,
} from 'discord.js';
import Bot from '../../../client/Bot';
import { CommandHandler } from '../../../interfaces/Command';
import { getSafeReplyFunction } from '../../../utils/InteractionUtils';
import { utcToday } from '../../../utils/DateUtils';
import { getDebug, getEnabled, runRNGdleJobForDate } from '../RNGdleUtils';
import { getAllRNGdleRolls, getAllRNGdleRollsForUser, getBottomRNGdleRollForEachUser, getTopRNGdleRollForEachUser, getTotalRNGdleEPForEachUser, TotalRNGdleEP, upsertRNGdleUsername } from '../RNGdleQueries';
import { createLeaderboardGroup, defineBoard } from '../../../utils/LeaderboardUtils';
import { RNGdleRoll } from '../models/RNGdleRoll';

function formatRNGdleRoll(roll: RNGdleRoll): string {
    return `${roll.number} (${roll.ep.toLocaleString()} EP)`;
}

export const leaderboard = createLeaderboardGroup(
    { id: 'rngdle', title: 'RNGdle Leaderboard', defaultBoard: 'top' },
    {
        "top": defineBoard<RNGdleRoll>({
            label: 'Highest EP Roll per User',
            valueColumnName: 'Roll',
            fetch: getTopRNGdleRollForEachUser,
            mapEntry: (roll, rank) => [
                `<@${roll.user}>`,
                formatRNGdleRoll(roll),
            ],
        }),
        "bottom": defineBoard<RNGdleRoll>({
            label: 'Lowest EP Roll per User',
            valueColumnName: 'Roll',
            fetch: getBottomRNGdleRollForEachUser,
            mapEntry: (roll, rank) => [
                `<@${roll.user}>`,
                formatRNGdleRoll(roll),
            ],
        }),
        "lifetime": defineBoard<TotalRNGdleEP>({
            label: 'Lifetime EP',
            valueColumnName: 'EP',
            fetch: getTotalRNGdleEPForEachUser,
            mapEntry: (roll, rank) => [
                `<@${roll.user}>`,
                roll.totalEp.toString(),
            ],
        }),
        "alltime": defineBoard<RNGdleRoll>({
            label: 'All Rolls',
            valueColumnName: 'Roll',
            fetch: getAllRNGdleRolls,
            mapEntry: (roll, rank) => [
                `<@${roll.user}>`,
                formatRNGdleRoll(roll),
            ],
        }),
    }
);

const COMMANDS: { [key: string]: CommandHandler } = {
    username: async function (
        client: Bot,
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const username = interaction.options.getString('username', true);
        await upsertRNGdleUsername(interaction.user.id, username);
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `Oki! I'll keep track of your RNGdle scores with that username from now on!`,
            ephemeral: true,
        });
        client.logger?.info(
            `Set ${interaction.user.username}'s RNGdle username to ${username}`
        );
    },
    leaderboard: async function (
        client: Bot,
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const board = interaction.options.getString('board') ?? undefined;
        await leaderboard.reply(client, interaction, board);
        client.logger?.debug(
            `Generated initial RNGdle leaderboard for ${interaction.user.tag} (from command)`
        );
    },
    stats: async function (
        client: Bot,
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const user = interaction.options.getUser('user') ?? interaction.user;
        const isSelf = user.id === interaction.user.id;
        const rolls = await getAllRNGdleRollsForUser(user.id);
        if (rolls.length === 0) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content: isSelf ? 'You have no RNGdle rolls yet!' : `<@${user.id}> has no RNGdle rolls yet!`,
                ephemeral: true,
            });
            return;
        }
        const topRoll = rolls.reduce((prev, curr) => (curr.ep > prev.ep ? curr : prev));
        const bottomRoll = rolls.reduce((prev, curr) => (curr.ep < prev.ep ? curr : prev));
        const totalEp = rolls.reduce((sum, roll) => sum + roll.ep, 0);
        const averageEp = totalEp / rolls.length;
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `Here are ${isSelf ? "your" : `<@${user.id}>'s`} RNGdle stats:\n\n- Total Rolls: ${rolls.length}\n- Top Roll: ${formatRNGdleRoll(topRoll)}\n- Bottom Roll: ${formatRNGdleRoll(bottomRoll)}\n- Total EP: ${totalEp.toLocaleString()}\n- Average EP per Roll: ${averageEp.toFixed(2)}`,
            allowedMentions: { parse: [] }
        });
    },
    debug: async function (
        client: Bot,
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const dmChannel =
            interaction.user.dmChannel ?? (await interaction.user.createDM());
        const dateOption = interaction.options.getString('date');
        let date: Date;
        if (dateOption) {
            const parsedDate = Date.parse(dateOption);
            if (isNaN(parsedDate)) {
                await getSafeReplyFunction(
                    client,
                    interaction
                )({
                    content:
                        "That doesn't look like a valid date!! Make sure to use YYYY-MM-DD format!",
                    ephemeral: true,
                });
                return;
            }
            date = new Date(parsedDate);
        } else {
            date = utcToday();
        }
        await interaction.deferReply({ ephemeral: true });
        await runRNGdleJobForDate(client, date, dmChannel, interaction.guild!);
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `Sent the RNGdle summary for ${
                date.toISOString().split('T')[0]
            } to your DMs!`,
            ephemeral: true,
        });
    },
};

export const handler: CommandHandler = async (
    client: Bot,
    interaction: ChatInputCommandInteraction
) => {
    const subcommand = interaction.options.getSubcommand(false);
    if (subcommand) {
        const subcommandHandler = COMMANDS[subcommand];
        if (subcommandHandler) {
            await subcommandHandler(client, interaction);
        } else {
            throw new Error(
                `Unknown subcommand for RNGdle Command: "${subcommand}"`
            );
        }
    } else {
        throw new Error('No subcommand was given for RNGdle Command');
    }
};
export const builder = new SlashCommandBuilder()
    .setName('rngdle')
    .setDescription('Various functions related to RNGdle!')
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('username')
            .setDescription('Set your RNGdle username!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('username')
                    .setDescription('Your RNGdle username')
                    .setRequired(true)
            )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('leaderboard')
            .setDescription('View the RNGdle leaderboard!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('board')
                    .setChoices(
                        { name: 'Top Roll per User', value: 'top' },
                        { name: 'Bottom Roll per User', value: 'bottom' },
                        { name: 'Lifetime EP', value: 'lifetime' },
                        { name: 'All Rolls', value: 'alltime' }

                    )
                    .setDescription(
                        'The leaderboard board to view (default: top)'
                    )
                    .setRequired(false)
            )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('stats')
            .setDescription('View a user\'s RNGdle stats!')
            .addUserOption(
                new SlashCommandUserOption()
                    .setName('user')
                    .setDescription('The user whose stats to view')
                    .setRequired(false)
            )
    );
if (getDebug()) {
    builder.addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('debug')
            .setDescription('Send a daily summary to your DMs!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('date')
                    .setDescription('The date for which to send a summary')
                    .setRequired(false)
            )
    );
}

export const guildOnly = (interaction: CommandInteraction) => true;

export const permissions = (
    interaction: CommandInteraction
): PermissionsString[] =>
    interaction.isChatInputCommand() &&
    interaction.options.getSubcommand(false) === 'debug'
        ? ['Administrator']
        : [];

export const shouldLoad = getEnabled;
