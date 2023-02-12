import {
    SlashCommandBuilder,
    SlashCommandStringOption,
    SlashCommandSubcommandBuilder,
} from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import Bot from '../../client/Bot';
import { CommandHandler } from '../../interfaces/Command';
import { getSafeReplyFunction } from '../../utils/InteractionUtils';

async function handleNameSetSubCommand(
    client: Bot,
    interaction: CommandInteraction
): Promise<void> {
    const name = interaction.options.getString('name');
    if (!name) {
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: "Huh?? You didn't give me your name!",
            ephemeral: true,
        });
    } else {
        await client.database.insertOrUpdateName(interaction.user.id, name);
        await getSafeReplyFunction(
            client,
            interaction
        )({
            content: `Oki! I'll call you ${name} from now on!`,
            ephemeral: true,
        })
        client.logger?.info(`Set ${interaction.user.username}'s name to ${name}`);
    }
}

async function handleNameClearSubCommand(
    client: Bot,
    interaction: CommandInteraction
): Promise<void> {
    await client.database.clearName(interaction.user.id);
    await getSafeReplyFunction(
        client,
        interaction
    )({
        content: `Sure, I'll just call you whatever your nickname is from now on!`,
        ephemeral: true,
    });
    client.logger?.info(`Cleared ${interaction.user.username}'s name`);
}

export const handler: CommandHandler = async (
    client: Bot,
    interaction: CommandInteraction
) => {
    const subcommand = interaction.options.getSubcommand(false);
    if (subcommand) {
        if (subcommand === 'set') {
            await handleNameSetSubCommand(client, interaction);
        } else if (subcommand === 'clear') {
            await handleNameClearSubCommand(client, interaction);
        } else {
            throw new Error(
                `Unknown subcommand for Name Command: "${subcommand}"`
            );
        }
    } else {
        throw new Error('No subcommand was given for Name Command');
    }
};
export const builder = new SlashCommandBuilder()
    .setName('name')
    .setDescription('Lets talk about your name!!')
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('set')
            .setDescription('Tell me what your name is!')
            .addStringOption(
                new SlashCommandStringOption()
                    .setName('name')
                    .setDescription('What I should call you!')
                    .setRequired(true)
            )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
            .setName('clear')
            .setDescription(
                "I'll forget your set name and use your name in the server!"
            )
    );

export const guildOnly = (interaction: CommandInteraction) => false;

export const permissions = (interaction: CommandInteraction) => false;

export const shouldLoad = () => true;
