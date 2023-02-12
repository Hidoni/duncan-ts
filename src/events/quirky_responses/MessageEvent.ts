import Conf from 'conf';
import { Guild, Message, Snowflake, TextChannel } from 'discord.js';
import { readFileSync } from 'fs';
import { setTimeout } from 'timers/promises';
import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';

const QUIRKY_RESPONSES = readFileSync('./quirky-responses.txt', 'utf8')
    .trim()
    .split('\n');
const OUIJA_BOARD_CHANNEL = '809001007560392714';
const NO_VOWELS_CHANNEL = '801726137058721792';
const OUIJA_BOARD_CHANCE = 1 / 50;
const NO_VOWELS_CHANCE = 1 / 20;
const CHANNEL_CHANCE_MAP = new Map([
    [OUIJA_BOARD_CHANNEL, OUIJA_BOARD_CHANCE],
    [NO_VOWELS_CHANNEL, NO_VOWELS_CHANCE],
]);
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
    '949461359060463616',
];

function getEnabled(): boolean {
    const config = new Conf();
    const enabled = config.get('quirky_responses.enabled');
    return typeof enabled === 'boolean' ? enabled : false;
}

async function getUserPreferredName(
    client: Bot,
    user: Snowflake,
    guild: Guild
) {
    const name = await client.database.getName(user);
    if (name) {
        return name;
    }
    const guildUser = await guild.members.fetch(user);
    const nickname = guildUser.nickname;
    if (nickname) {
        return nickname;
    }
    return guildUser.displayName;
}

async function getRandomUserToMentionInGuild(
    guild: Guild,
    excluded: Snowflake[] | null
) {
    const guildMembers = Array.from(
        (await guild.members.fetch())
            .filter((member) => !excluded || excluded.indexOf(member.id) == -1)
            .values()
    );
    if (guildMembers.length === 0) {
        throw Error('Server is too small to get another member!');
    }
    return guildMembers[Math.floor(Math.random() * guildMembers.length)];
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
            await getRandomUserToMentionInGuild(guild, [message.author.id, client.user!.id]).then(
                (member) => getUserPreferredName(client, member.id, guild)
            )
        );
}

async function getRandomResponse(client: Bot, message: Message) {
    if (message.channelId === OUIJA_BOARD_CHANNEL) {
        // Send a random uppercase letter or the word 'Goodbye'
        const randomNumber = Math.floor(Math.random() * 27);
        const response =
            randomNumber < 26
                ? String.fromCharCode(65 + randomNumber)
                : 'Goodbye';
        return response;
    }
    if (message.channelId === NO_VOWELS_CHANNEL) {
        // Send a quirky response, but without vowels
        const randomIndex = Math.floor(Math.random() * QUIRKY_RESPONSES.length);
        const response = QUIRKY_RESPONSES[randomIndex];
        return (await formatResponse(client, message, response)).replace(
            /[aeiou]/gi,
            ''
        );
    }
    const randomIndex = Math.floor(Math.random() * QUIRKY_RESPONSES.length);
    return formatResponse(client, message, QUIRKY_RESPONSES[randomIndex]);
}

async function sendQuirkyResponse(client: Bot, message: Message) {
    if (
        message.channel instanceof TextChannel &&
        WHITELISTED_CHANNELS.find((value) => value === message.channelId)
    ) {
        if (
            Math.random() <=
            (CHANNEL_CHANCE_MAP.get(message.channelId) || DEFAULT_CHANCE)
        ) {
            const randomResponse = await getRandomResponse(client, message);
            client.logger?.info(
                `Responding to ${message.author.username} in ${message.channel.name} with a quirky response!! (${randomResponse})`
            );
            await message.channel.sendTyping();
            await setTimeout(500 + Math.random() * 6000); // 500 - 6500MS
            await message.channel.send(randomResponse);
        }
    }
}

export const name: string = 'messageCreate';
export const handler: EventHandler = async (client: Bot, message: Message) => {
    if (message.author.id !== client.user?.id) {
        await sendQuirkyResponse(client, message);
    }
};
export const shouldLoad = getEnabled;
