import Conf from 'conf';
import { Message, TextChannel } from 'discord.js';
import { readFileSync } from 'fs';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';

const QUIRKY_RESPONSES = readFileSync('./quirky-responses.txt', 'utf8')
    .trim()
    .split('\n');
const OUIJA_BOARD_CHANNEL = '809001007560392714';
const NO_VOWELS_CHANNEL = '801726137058721792';
const OUIJA_BOARD_CHANCE = 1 / 50;
const NO_VOWELS_CHANCE = 1 / 20;
const DEFAULT_CHANCE = 1 / 300;
const WHITELISTED_CHANNELS = [
    '636890842275250176',
    '536033136719691796',
    '483374904532664331',
    '484332739680665614',
    '483376494551236628',
    '483381489019387904',
    '483421824625934346',
    '483376480923942912',
    '489276455315046412',
    '483376522950869014',
    '483793171214499840',
    '801726137058721792',
    '809001007560392714',
];

function getEnabled(): boolean {
    const config = new Conf();
    const enabled = config.get('quirky_responses.enabled');
    return typeof enabled === 'boolean' ? enabled : false;
}

async function sendQuirkyResponse(client: Bot, message: Message) {
    if (
        message.channel instanceof TextChannel &&
        WHITELISTED_CHANNELS.find((value) => value === message.channelId)
    ) {
        if (message.channelId === OUIJA_BOARD_CHANNEL) {
            if (Math.random() <= OUIJA_BOARD_CHANCE) {
                // Send a random uppercase letter or the word 'Goodbye'
                const randomNumber = Math.floor(Math.random() * 27);
                const response =
                    randomNumber < 26
                        ? String.fromCharCode(65 + randomNumber)
                        : 'Goodbye';
                client.logger?.info(
                    `Responding to ${message.author.username} in ${message.channel.name} with a quirky response!!`
                );
                await message.channel.send(response);
            }
        } else if (message.channelId === NO_VOWELS_CHANNEL) {
            if (Math.random() <= NO_VOWELS_CHANCE) {
                // Send a quirky response, but without vowels
                const randomIndex = Math.floor(
                    Math.random() * QUIRKY_RESPONSES.length
                );
                const response = QUIRKY_RESPONSES[randomIndex];
                client.logger?.info(
                    `Responding to ${message.author.username} in ${message.channel.name} with a quirky response!!`
                );
                await message.channel.send(response.replace(/[aeiou]/gi, ''));
            }
        } else {
            if (Math.random() <= DEFAULT_CHANCE) {
                // Send a random quirky response
                const randomIndex = Math.floor(
                    Math.random() * QUIRKY_RESPONSES.length
                );
                client.logger?.info(
                    `Responding to ${message.author.username} in ${message.channel.name} with a quirky response!!`
                );
                await message.channel.send(QUIRKY_RESPONSES[randomIndex]);
            }
        }
    }
}

export const name: string = 'messageCreate';
export const handler: EventHandler = async (client: Bot, message: Message) => {
    if (message.author.id !== client.user?.id) {
        await sendQuirkyResponse(client, message);
    }
};
export const shoudLoad = getEnabled;
