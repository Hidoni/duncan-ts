import Conf from 'conf';
import { Message, TextChannel } from 'discord.js';
import { readFileSync } from 'fs';
import { setTimeout } from 'timers/promises';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import {
    getRandomUserToMentionInGuild,
    getUserPreferredName,
} from '../../utils/InteractionUtils';

const OUIJA_BOARD_CHANNEL = '809001007560392714';
const NO_VOWELS_CHANNEL = '801726137058721792';
const NERDROOM_CHANNEL = '483376494551236628';

const WHITELISTED_CHANNELS = [
    '636890842275250176',
    '536033136719691796',
    '483374904532664331',
    '484332739680665614',
    NERDROOM_CHANNEL,
    '483381489019387904',
    '483421824625934346',
    '483376480923942912',
    '489276455315046412',
    '483376522950869014',
    '483793171214499840',
    NO_VOWELS_CHANNEL,
    OUIJA_BOARD_CHANNEL,
    '949461359060463616',
];

const DEFAULT_CHANCE = 1 / 300;

const OUIJA_BOARD_CHANCE = 1 / 50;
const NO_VOWELS_CHANCE = 1 / 20;
const CHANNEL_CHANCE_MAP = new Map([
    [OUIJA_BOARD_CHANNEL, OUIJA_BOARD_CHANCE],
    [NO_VOWELS_CHANNEL, NO_VOWELS_CHANCE],
]);

const QUIRKY_RESPONSES = readFileSync('./quirky-responses.txt', 'utf8')
    .trim()
    .split('\n');

const OUIJA_BOARD_QUIRKY_RESPONSES = Array.from({ length: 26 }, (_, i) =>
    String.fromCharCode(65 + i)
).concat(['Goodbye']);
const NERDROOM_QUIRKY_RESPONSES = QUIRKY_RESPONSES.concat(
    new Array(Math.floor(QUIRKY_RESPONSES.length / 20)).fill('🤓👆')
);
const CHANNEL_RESPONSE_MAP = new Map([
    [OUIJA_BOARD_CHANNEL, OUIJA_BOARD_QUIRKY_RESPONSES],
    [NERDROOM_CHANNEL, NERDROOM_QUIRKY_RESPONSES],
]);

const NO_VOWELS_RESPONSE_MODIFIER = (response: string) =>
    response.replace(/[aeiou]/gi, '');
const CHANNEL_RESPONSE_MODIFIER_MAP = new Map([
    [NO_VOWELS_CHANNEL, NO_VOWELS_RESPONSE_MODIFIER],
]);

const REPLY_TO_MESSAGE_CHANCE = 1 / 4;
const REPLY_EXCLUDED_CHANNELS = [OUIJA_BOARD_CHANNEL];

function getEnabled(): boolean {
    const config = new Conf();
    const enabled = config.get('quirky_responses.enabled');
    return typeof enabled === 'boolean' ? enabled : false;
}

async function formatResponse(client: Bot, message: Message, response: string) {
    const guild = message.guild;
    if (!guild) {
        throw Error('formatResponse called in non-guild context');
    }
    return response
        .replace(
            /\{sender}/gi,
            await getUserPreferredName(client, message.author.id, guild)
        )
        .replace(
            /\{random}/gi,
            await getRandomUserToMentionInGuild(guild, [
                message.author.id,
                client.user!.id,
            ]).then((member) => getUserPreferredName(client, member.id, guild))
        );
}

async function getRandomResponse(client: Bot, message: Message) {
    const channelSpecificResponses =
        CHANNEL_RESPONSE_MAP.get(message.channelId) || QUIRKY_RESPONSES;
    const responseModifier = CHANNEL_RESPONSE_MODIFIER_MAP.get(
        message.channelId
    );
    const randomIndex = Math.floor(
        Math.random() * channelSpecificResponses.length
    );
    const response = channelSpecificResponses[randomIndex];
    const formattedResponse = await formatResponse(client, message, response);
    return responseModifier
        ? responseModifier(formattedResponse)
        : formattedResponse;
}

async function sendQuirkyResponse(client: Bot, message: Message) {
    if (
        !(message.channel instanceof TextChannel) ||
        !WHITELISTED_CHANNELS.find((value) => value === message.channelId) ||
        Math.random() >
            (CHANNEL_CHANCE_MAP.get(message.channelId) || DEFAULT_CHANCE)
    ) {
        return;
    }

    const randomResponse = await getRandomResponse(client, message);
    client.logger?.info(
        `Responding to ${message.author.username} in ${message.channel.name} with a quirky response!! (${randomResponse})`
    );
    await message.channel.sendTyping();
    const typingDuration = 500 + Math.random() * 6000;
    await setTimeout(typingDuration);
    if (!REPLY_EXCLUDED_CHANNELS.includes(message.channelId) && Math.random() < REPLY_TO_MESSAGE_CHANCE) {
        await message.reply({ content: randomResponse, allowedMentions: { repliedUser: false } });
    } else {
        await message.channel.send(randomResponse);
    }
}

export const name: string = 'messageCreate';
export const handler: EventHandler = async (client: Bot, message: Message) => {
    if (message.author.id !== client.user?.id) {
        await sendQuirkyResponse(client, message);
    }
};
export const shouldLoad = getEnabled;
