import {
    ChatInputCommandInteraction,
    LabelBuilder,
    ModalBuilder,
    PermissionsString,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';
import Bot from '../../client/Bot';
import { CommandHandler } from '../../interfaces/Command';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';
import {
    DEFAULT_EMBED_COLOR,
    EmbedAttributes,
    generateLeaderboardComponentsRow,
    LeaderboardMap,
    generateLeaderboardEmbed,
} from '../../utils/LeaderboardUtils';
import {
    getEnabled,
    getTotalScoresMap,
    runMapTapJobForDate,
} from '../../utils/MapTapUtils';
import { utcToday } from '../../utils/DateUtils';

export const leaderboardEmbedAttributes: EmbedAttributes = {
    title: 'MapTap Leaderboard',
    color: DEFAULT_EMBED_COLOR,
    keyName: 'User',
    valueName: 'Points',
};
export const leaderboardMappingFunction: LeaderboardMap<[string, number]> = (
    value
) => [`<@${value[0]}>`, value[1].toString()];

const COMMANDS: { [key: string]: CommandHandler } = {
    leaderboard: async function (
        client: Bot,
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const scores = getTotalScoresMap(
            await client.database.getAllMapTapScores()
        );
        const leaderboardembed = generateLeaderboardEmbed(
            Array.from(scores.entries()),
            leaderboardMappingFunction,
            1,
            leaderboardEmbedAttributes
        );
        const leaderboardComponenetsRow = generateLeaderboardComponentsRow(
            Array.from(scores.entries()),
            1,
            `map_tap_scores_leaderboard_${interaction.user.id}`
        );
        await getSafeReplyFunction(
            client,
            interaction
        )({
            embeds: [leaderboardembed],
            components: [leaderboardComponenetsRow],
        });
    },
    submit: async function (
        client: Bot,
        interaction: ChatInputCommandInteraction
    ): Promise<void> {
        const modal = new ModalBuilder()
            .setCustomId(`map_tap_submit_modal`)
            .setTitle('Submit MapTap Score for today!')
            .setLabelComponents(
                new LabelBuilder()
                    .setLabel('Your MapTap score (copy-paste from maptap.gg)')
                    .setTextInputComponent(
                        new TextInputBuilder()
                            .setCustomId('score')
                            .setPlaceholder(
                                `www.maptap.gg ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}\n100🎯 100🎯 100🎯 100🎯 100🎯\nFinal score: 1000`
                            )
                            .setStyle(TextInputStyle.Paragraph)
                            .setRequired(true)
                    )
            );
        await interaction.showModal(modal);
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
                    content: "That doesn't look like a valid date!! Make sure to use YYYY-MM-DD format!",
                    ephemeral: true,
                });
                return;
            }
            date = new Date(parsedDate);
        } else {
            date = utcToday();
        }
        date = new Date(date.toISOString().replace("Z", "-12:00")); // Convert to latest timezone to make sure dates line up with cron invocation ones.
        await interaction.deferReply({ ephemeral: true });
        await runMapTapJobForDate(client, date, dmChannel);
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `Sent the MapTap summary for ${date.toISOString().split('T')[0]} to your DMs!`,
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
                `Unknown subcommand for MapTap Command: "${subcommand}"`
            );
        }
    } else {
        throw new Error('No subcommand was given for MapTap Command');
    }
};
export const builder = new SlashCommandBuilder()
    .setName('maptap')
    .setDescription('Various functions related to MapTap!')
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('leaderboard')
            .setDescription('Shows the leaderboard for MapTap scores!')
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('submit')
            .setDescription('Manually submit your MapTap scores!')
    )
    .addSubcommand(
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

export const guildOnly = (interaction: ChatInputCommandInteraction) => true;

export const permissions = (
    interaction: ChatInputCommandInteraction
): PermissionsString[] =>
    interaction.options.getSubcommand(false) === 'debug'
        ? ['Administrator']
        : [];

export const shouldLoad = getEnabled;
