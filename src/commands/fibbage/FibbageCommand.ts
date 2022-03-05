import {
    SlashCommandBuilder,
    SlashCommandSubcommandBuilder,
    SlashCommandSubcommandGroupBuilder,
} from '@discordjs/builders';
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    Snowflake,
} from 'discord.js';
import Bot from '../../client/Bot';
import {
    FibbageStats,
    FibbageStatsColumns,
} from '../../database/models/FibbageStats';
import { CommandHandler } from '../../interfaces/Command';
import { getEnabled, getRole } from '../../utils/FibbageUtils';
import {
    DEFAULT_EMBED_COLOR,
    generateLeaderboardComponentsRow,
    generateLeaderboardEmbed,
    LeaderboardMap,
} from '../../utils/LeaderboardUtils';

const MAX_COMPONENTS_PER_ROW = 5;

interface LeaderboardSubcommandDetails {
    column: keyof FibbageStatsColumns;
    title: string;
    name: string;
}

const LEADERBOARD_SUBCOMMAND_TO_DETAILS: Record<
    string,
    LeaderboardSubcommandDetails
> = {
    points: {
        column: 'points',
        title: 'Player Points',
        name: 'Points',
    },
    guessers: {
        column: 'timesAnsweredCorrectly',
        title: 'Best Guessers',
        name: 'Times Guessed Correctly',
    },
    liars: {
        column: 'timesOthersFooled',
        title: 'Best Liars',
        name: 'Times Others Guessed Their Lies',
    },
    gullible: {
        column: 'timesFooled',
        title: 'Most Gullible Players',
        name: 'Times They Picked Lies',
    },
    reputable: {
        column: 'timesOthersAnsweredCorrectly',
        title: 'Most Reputable Players',
        name: 'Times Others Picked The Truth',
    },
    questions: {
        column: 'questionsSubmitted',
        title: 'Most Questions Submitted',
        name: 'Questions Submitted',
    },
    lies: {
        column: 'liesSubmitted',
        title: 'Most Lies Submitted',
        name: 'Lies Submitted',
    },
    guesses: {
        column: 'timesGuessed',
        title: 'Most Guesses Submitted',
        name: 'Guesses Submitted',
    },
};

function isValidLeaderboardSubcommand(
    subcommand: string
): subcommand is keyof typeof LEADERBOARD_SUBCOMMAND_TO_DETAILS {
    return subcommand in LEADERBOARD_SUBCOMMAND_TO_DETAILS;
}

function getLeaderboardEmbedAttributesForColumn(
    subcommand: keyof typeof LEADERBOARD_SUBCOMMAND_TO_DETAILS
) {
    const subcommandDetails = LEADERBOARD_SUBCOMMAND_TO_DETAILS[subcommand];
    return {
        title: subcommandDetails.title,
        color: DEFAULT_EMBED_COLOR,
        keyName: 'User',
        valueName: subcommandDetails.name,
    };
}

function getLeaderboardMappingFunctionForColumn(
    column: keyof FibbageStatsColumns
): LeaderboardMap<FibbageStats> {
    return (value: FibbageStats) => [
        `<@${value.id}>`,
        value[column].toString(),
    ];
}

function getLeaderboardSwitcherActionRows(
    currentSubcommand: keyof typeof LEADERBOARD_SUBCOMMAND_TO_DETAILS,
    userId: Snowflake
): MessageActionRow[] {
    const rows = [new MessageActionRow()];
    let currentRow = rows[0];
    for (const subcommand of Object.keys(LEADERBOARD_SUBCOMMAND_TO_DETAILS)) {
        if (currentRow.components.length === MAX_COMPONENTS_PER_ROW) {
            currentRow = new MessageActionRow();
            rows.push(currentRow);
        }
        const subcommandDetails = LEADERBOARD_SUBCOMMAND_TO_DETAILS[subcommand];
        currentRow.addComponents(
            new MessageButton()
                .setLabel(subcommandDetails.title)
                .setStyle('PRIMARY')
                .setDisabled(subcommand === currentSubcommand)
                .setCustomId(
                    `fibbage_leaderboard_switcher_${subcommand}_${userId}_FIRST`
                )
        );
    }
    return rows;
}

export async function getLeaderboardFromSubcommand(
    client: Bot,
    subcommand: keyof typeof LEADERBOARD_SUBCOMMAND_TO_DETAILS,
    userId: Snowflake,
    page: number | 'FIRST' | 'LAST'
) {
    const columnOfInterest =
        LEADERBOARD_SUBCOMMAND_TO_DETAILS[subcommand].column;
    const stats = await client.database.getFibbageStatsByColumn(
        columnOfInterest
    );
    if (page === 'FIRST') {
        page = 1;
    } else if (page === 'LAST') {
        page = Math.ceil(stats.length / 10);
    }
    const leaderboardembed = generateLeaderboardEmbed(
        stats,
        getLeaderboardMappingFunctionForColumn(columnOfInterest),
        page,
        getLeaderboardEmbedAttributesForColumn(subcommand)
    );
    const leaderboardComponenetsRow = generateLeaderboardComponentsRow(
        stats,
        page,
        `fibbage_leaderboard_${subcommand}_${userId}`
    );
    const outputActionRows = [leaderboardComponenetsRow].concat(
        getLeaderboardSwitcherActionRows(subcommand, userId)
    );
    return { leaderboardembed, outputActionRows };
}

async function handleLeaderboard(
    client: Bot,
    interaction: CommandInteraction,
    subcommand: string
) {
    if (!isValidLeaderboardSubcommand(subcommand)) {
        await interaction.reply({
            content: `Huh.. What kind of leaderboard is a ${subcommand} one?`,
            ephemeral: true,
        });
        return;
    }
    const { leaderboardembed, outputActionRows } =
        await getLeaderboardFromSubcommand(
            client,
            subcommand,
            interaction.user.id,
            1
        );
    await interaction.reply({
        embeds: [leaderboardembed],
        components: outputActionRows,
    });
    client.logger?.info(
        `Generated ${subcommand} leaderboard for ${interaction.user.tag}`
    );
}

async function giveFibbageRole(client: Bot, interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({
            content: 'Sowwy, you can only use this command in a server!',
            ephemeral: true,
        });
        return;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (member.roles.cache.has(getRole())) {
        await interaction.reply({
            content: 'Huh?? You already have the role!!',
            ephemeral: true,
        });
        return;
    }
    await member.roles.add(getRole());
    await client.database.getFibbageStats(interaction.user.id);
    await interaction.reply({
        content:
            "Welcome to Fibbage, I'll start asking you for lies and answers to questions now! ^w^",
        ephemeral: true,
    });
    client.logger?.info(`Gave fibbage role to ${member.user.tag}`);
}

async function removeFibbageRole(client: Bot, interaction: CommandInteraction) {
    if (!interaction.guild) {
        await interaction.reply({
            content: 'Sowwy, you can only use this command in a server!',
            ephemeral: true,
        });
        return;
    }
    const member = await interaction.guild.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(getRole())) {
        await interaction.reply({
            content: "Hey... You don't even have the role??",
            ephemeral: true,
        });
        return;
    }
    await member.roles.remove(getRole());
    await interaction.reply({
        content:
            "I'm sorry to see you leave ;w;\nIf you still have any unaswered lies or questions, you'll can still answer them, but I won't ask you new ones!",
        ephemeral: true,
    });
    client.logger?.info(`Removed fibbage role from ${member.user.tag}`);
}

async function handleDefault(
    client: Bot,
    interaction: CommandInteraction,
    subcommand: string
) {
    switch (subcommand) {
        case 'join':
            await giveFibbageRole(client, interaction);
            break;
        case 'quit':
            await removeFibbageRole(client, interaction);
            break;
        default:
            throw new Error(`Unknown fibbage subcommand ${subcommand}`);
    }
}

export const handler: CommandHandler = async (
    client: Bot,
    interaction: CommandInteraction
) => {
    const subcommandGroup = interaction.options.getSubcommandGroup(false);
    const subcommand = interaction.options.getSubcommand(false);
    if (!subcommand) {
        throw new Error('No subcommand provided for Fibbage command');
    }
    switch (subcommandGroup) {
        case 'leaderboard':
            await handleLeaderboard(client, interaction, subcommand);
            break;
        default:
            await handleDefault(client, interaction, subcommand);
            break;
    }
};

export const builder = new SlashCommandBuilder()
    .setName('fibbage')
    .setDescription('Various functions relating to Fbbage!')
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('join')
            .setDescription(
                'Join the Fibbage game, I will start messaging you questions and asking you for lies if you join!'
            )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('quit')
            .setDescription('Quit the Fibbage game.')
    )
    .addSubcommandGroup(
        new SlashCommandSubcommandGroupBuilder()
            .setName('leaderboard')
            .setDescription('View the various leaderboards for Fibbage!')
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('points')
                    .setDescription('View the points leaderboard.')
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('guessers')
                    .setDescription('View the best guessers!')
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('liars')
                    .setDescription('View the best liars!')
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('gullible')
                    .setDescription(
                        "View the players who fell for others' lies the most!"
                    )
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('reputable')
                    .setDescription(
                        'View the players who are the most well known!'
                    )
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('questions')
                    .setDescription(
                        'View the players who have answered the most questions.'
                    )
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('lies')
                    .setDescription(
                        'View the players who have submitted the most lies.'
                    )
            )
            .addSubcommand(
                new SlashCommandSubcommandBuilder()
                    .setName('guesses')
                    .setDescription(
                        'View the players who have guessed the most times.'
                    )
            )
    );

export const guildOnly = () => true;

export const permissions = () => false;

export const shoudLoad = getEnabled;
