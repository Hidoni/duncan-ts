import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from '@discordjs/builders';
import { CommandInteraction, PermissionString } from 'discord.js';
import { UniqueConstraintError } from 'sequelize';
import Bot from '../../client/Bot';
import { CommandHandler } from '../../interfaces/Command';
import {
    capitalizeQuestion,
    changeQuestion,
} from '../../utils/QuestionOfTheDayUtils';

interface QuestionOfTheDayCommandAttributes {
    guildOnly: boolean | undefined;
    permissions: PermissionString[] | undefined;
    handler: CommandHandler;
}

const COMMANDS: { [key: string]: QuestionOfTheDayCommandAttributes } = {
    add: {
        guildOnly: false,
        permissions: undefined,
        handler: async (
            client: Bot,
            interaction: CommandInteraction
        ): Promise<void> => {
            const question = interaction.options.getString('question');
            if (!question) {
                await interaction.reply({
                    content: "Huh?? You didn't give me a question!",
                    ephemeral: true,
                });
            } else {
                await client.database
                    .insertQuestion(
                        capitalizeQuestion(question),
                        interaction.user.username
                    )
                    .then(() => {
                        interaction.reply({
                            content:
                                "Oooh! That seems like a good one!! I'll add it to the list!",
                            ephemeral: true,
                        });
                        client.logger?.info(
                            `Added new prompt "${question}" by ${interaction.user.username} to the database.`
                        );
                    })
                    .catch((error) => {
                        if (error instanceof UniqueConstraintError) {
                            interaction.reply({
                                content:
                                    "Don't be silly, someone's already submitted that one!",
                                ephemeral: true,
                            });
                        } else {
                            throw error;
                        }
                    });
            }
        },
    },
    skip: {
        guildOnly: true,
        permissions: ['ADMINISTRATOR'],
        handler: async (
            client: Bot,
            interaction: CommandInteraction
        ): Promise<void> => {
            client.logger?.info(
                `Prompt skipped by ${interaction.user.username}`
            );
            interaction
                .reply({ content: 'Oki, skipping!!', ephemeral: true })
                .catch(() => client.logger?.debug('Could not reply to interaction when skipping!'));
            await changeQuestion(client);
        },
    },
};

export const handler: CommandHandler = async (
    client: Bot,
    interaction: CommandInteraction
) => {
    const subcommand = interaction.options.getSubcommand(false);
    if (subcommand) {
        const subcommandHandler = COMMANDS[subcommand]?.handler;
        if (subcommandHandler) {
            await subcommandHandler(client, interaction);
        } else {
            throw new Error(
                `Unknown subcommand for QOTD Command: "${subcommand}"`
            );
        }
    } else {
        throw new Error('No subcommand was given for QOTD Command');
    }
};
export const builder = new SlashCommandBuilder()
    .setName('qotd')
    .setDescription('Various functions relating to Question of The Day!')
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('add')
            .setDescription('Add a new question to the QOTD list.')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('question')
                    .setDescription('The question to add.')
                    .setRequired(true)
            )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('skip')
            .setDescription('Skip the current question.')
    );

export const guildOnly = (interaction: CommandInteraction) => {
    const subcommand = interaction.options.getSubcommand(false);
    if (subcommand) {
        const guildOnly = COMMANDS[subcommand]?.guildOnly;
        return guildOnly;
    }
    return false;
};

export const permissions = (interaction: CommandInteraction) => {
    const subcommand = interaction.options.getSubcommand(false);
    if (subcommand) {
        const permissions = COMMANDS[subcommand]?.permissions;
        return permissions;
    }
    return undefined;
};
