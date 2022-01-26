import { Message, TextChannel } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';

const QUIRKY_RESPONSES = readFileSync('./quirky-responses.txt', 'utf8')
    .trim()
    .replace('\r', '')
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

async function sendQuirkyResponse(message: Message) {
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
                await message.channel.send(response);
            }
        } else if (message.channelId === NO_VOWELS_CHANNEL) {
            if (Math.random() <= NO_VOWELS_CHANCE) {
                // Send a quirky response, but without vowels
                const randomIndex = Math.floor(
                    Math.random() * QUIRKY_RESPONSES.length
                );
                const response = QUIRKY_RESPONSES[randomIndex];
                await message.channel.send(response.replace(/[aeiou]/gi, ''));
            }
        } else {
            if (Math.random() <= DEFAULT_CHANCE) {
                // Send a random quirky response
                const randomIndex = Math.floor(
                    Math.random() * QUIRKY_RESPONSES.length
                );
                await message.channel.send(QUIRKY_RESPONSES[randomIndex]);
            }
        }
    }
}

export const name: string = 'messageCreate';
export const handler: EventHandler = async (client: Bot, message: Message) => {
    await sendQuirkyResponse(message);
};
