import {
    ChatInputCommandInteraction,
    CommandInteraction,
    PermissionsString,
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from 'discord.js';
import Bot from '../../../client/Bot';
import { CommandHandler } from '../../../interfaces/Command';
import { getSafeReplyFunction } from '../../../utils/InteractionUtils';
import { utcToday } from '../../../utils/DateUtils';
import { getDebug, getEnabled, runRNGdleJobForDate } from '../RNGdleUtils';
import { upsertRNGdleUsername } from '../RNGdleQueries';

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
