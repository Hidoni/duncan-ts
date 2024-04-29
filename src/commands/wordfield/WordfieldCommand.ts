import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import Bot from '../../client/Bot';
import { CommandHandler } from '../../interfaces/Command';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';
import { isUserAdmin } from '../../utils/PermissionUtils';
import {
    getBannedWordsList,
    getEnabled,
    setBannedWordsList,
} from '../../utils/WordfieldUtils';

const COMMANDS: { [key: string]: CommandHandler } = {
    add: async function (
        client: Bot,
        interaction: CommandInteraction
    ): Promise<void> {
        if (!isUserAdmin(interaction.user.id)) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content: "Nuh-uh, you can't use that!!",
                ephemeral: true,
            });
            return;
        }
        const word = interaction.options.getString('word')?.toLowerCase();
        if (!word) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content: "Huh?? You didn't give me a word!",
                ephemeral: true,
            });
            return;
        }
        const bannedWordsList = getBannedWordsList();
        if (bannedWordsList.indexOf(word) !== -1) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content: 'Huh?? That word is already in the list!',
                ephemeral: true,
            });
            return;
        }
        bannedWordsList.push(word);
        setBannedWordsList(bannedWordsList);
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: 'Oki, I added the word to the list!',
            ephemeral: true,
        });
    },
    remove: async function (
        client: Bot,
        interaction: CommandInteraction
    ): Promise<void> {
        if (!isUserAdmin(interaction.user.id)) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content: "Nuh-uh, you can't use that!!",
                ephemeral: true,
            });
            return;
        }
        const word = interaction.options.getString('word')?.toLowerCase();
        if (!word) {
            await getSafeReplyFunction(
                client,
                interaction
            )({
                content: "Huh?? You didn't give me a word!",
                ephemeral: true,
            });
            return;
        }
        const bannedWordsList = getBannedWordsList();
        setBannedWordsList(bannedWordsList.filter((value) => value != word));
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: 'Oki, I removed the word from the list!',
            ephemeral: true,
        });
    },
    list: async function (
        client: Bot,
        interaction: CommandInteraction
    ): Promise<void> {
        const bannedWordsList = getBannedWordsList();
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `The currently banned words are:\n${bannedWordsList.join(
                '\n'
            )}`,
            ephemeral: true,
        });
    },
};

export const handler: CommandHandler = async (
    client: Bot,
    interaction: CommandInteraction
) => {
    const subcommand = interaction.options.getSubcommand(false);
    if (subcommand) {
        const subcommandHandler = COMMANDS[subcommand];
        if (subcommandHandler) {
            await subcommandHandler(client, interaction);
        } else {
            throw new Error(
                `Unknown subcommand for Wordfield Command: "${subcommand}"`
            );
        }
    } else {
        throw new Error('No subcommand was given for Wordfield Command');
    }
};

export const builder = new SlashCommandBuilder()
    .setName('wordfield')
    .setDescription('Various functions related to Wordfield!')
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('add')
            .setDescription('Add a new word to the Wordfield list!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('word')
                    .setDescription('The word to add')
                    .setRequired(true)
            )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('remove')
            .setDescription('Remove a word from the Wordfield list!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('word')
                    .setDescription('The word to remove')
                    .setRequired(true)
            )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('list')
            .setDescription('View the list of banned Wordfield words!')
    );

export const guildOnly = (interaction: CommandInteraction) => true;

export const permissions = (interaction: CommandInteraction) => false;

export const shouldLoad = getEnabled;
