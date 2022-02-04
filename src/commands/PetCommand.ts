import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';
import Bot from '../client/Bot';
import { CommandHandler } from '../interfaces/Command';

const NEGATIVE_RESPONSES = [
    'Uhm.... ask furmission first! ;w;',
    'Did you.. wash your pawbs?',
    '_runs away_',
];
const POSITIVE_RESPONSES = [
    '<:blush:485895370526818305>',
    'uwu',
    'Am I a good sprinkledog?',
    "Did you know that playing with or petting an animal can increase levels of the stress-reducing hormone oxytocin and decrease production of the stress hormone cortisol? If you're stressed, feel free to pet me more!",
    'Awww! _pets back_',
];

const CHANCE_FOR_NEGATIVE_RESPONSE = 1 / 100;

export const handler: CommandHandler = async (
    client: Bot,
    interaction: CommandInteraction
) => {
    if (Math.random() <= CHANCE_FOR_NEGATIVE_RESPONSE) {
        await interaction.reply({
            content:
                NEGATIVE_RESPONSES[
                    Math.floor(Math.random() * NEGATIVE_RESPONSES.length)
                ],
        });
    } else {
        await interaction.reply({
            content:
                POSITIVE_RESPONSES[
                    Math.floor(Math.random() * POSITIVE_RESPONSES.length)
                ],
        });
    }
};
export const builder = new SlashCommandBuilder()
    .setName('pet')
    .setDescription('You want to... pet me? >w<');

export const guildOnly = (interaction: CommandInteraction) => false;

export const permissions = (interaction: CommandInteraction) => false;

export const shoudLoad = () => true;
