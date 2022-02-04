import {
    SlashCommandBuilder,
    SlashCommandChannelOption,
    SlashCommandStringOption,
} from '@discordjs/builders';
import { TextChannel, ThreadChannel } from 'discord.js';
import { CommandInteraction } from 'discord.js';
import Bot from '../client/Bot';
import { CommandHandler } from '../interfaces/Command';
import { isUserAdmin } from '../utils/PermissionUtils';

const TEXT_CHANNEL_TYPES = [
    0, // GuildText
    11, // GuildThread
    12, // GuildThread
];

export const handler: CommandHandler = async (
    client: Bot,
    interaction: CommandInteraction
) => {
    if (!isUserAdmin(interaction.user.id)) {
        await interaction.reply({
            content: "Nuh-uh, you can't use that!!",
            ephemeral: true,
        });
    } else {
        const channel = await client.channels.fetch(
            interaction.options.getChannel('channel', true).id
        );
        const message = interaction.options.getString('message', true);
        if (
            !channel ||
            !(
                channel instanceof TextChannel ||
                channel instanceof ThreadChannel
            )
        ) {
            await interaction.reply({
                content: "Huh?? I can't send messages in that channel!!",
                ephemeral: true,
            });
        } else {
            await channel
                .send(message)
                .then(
                    async (sent) =>
                        await interaction.reply({
                            content: `Message sent, check it out: ${sent.url} ^w^`,
                            ephemeral: true,
                        })
                )
                .catch(async (err) => {
                    client.logger?.debug(
                        `Failed to send message as Duncan: ${err}`
                    );
                    await interaction.reply({
                        content: "Umm, I couldn't send a message... ;w;",
                        ephemeral: true,
                    });
                });
        }
    }
};
export const builder = new SlashCommandBuilder()
    .setName('send')
    .setDescription('Send a message as Duncan!')
    .addChannelOption(
        new SlashCommandChannelOption()
            .setName('channel')
            .setDescription('The channel in which to send the message.')
            .addChannelTypes(TEXT_CHANNEL_TYPES)
            .setRequired(true)
    )
    .addStringOption(
        new SlashCommandStringOption()
            .setName('message')
            .setDescription('The message to send.')
            .setRequired(true)
    );

export const guildOnly = (interaction: CommandInteraction) => false;

export const permissions = (interaction: CommandInteraction) => false;

export const shoudLoad = () => true;