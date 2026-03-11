import { MapTapScore } from '../database/models/MapTapScore';
import {
    addDaysToDate,
    dateToSnowflake,
    daysBetweenDates,
    midnightUTCDateForDate,
    utcToday,
} from './DateUtils';
import Conf from 'conf';
import { SendableChannels, AttachmentBuilder } from 'discord.js';
import { readFile } from 'fs';
import nodeHtmlToImage from 'node-html-to-image';
import { promisify } from 'util';
import Bot from '../client/Bot';

const MAPTAP_SCORE_REGEX =
    /www\.maptap\.gg\s+(\w+(?:\s+\d{1,2})?)\n(\d{1,3})\S+\s+(\d{1,3})\S+\s+(\d{1,3})\S+\s+(\d{1,3})\S+\s+(\d{1,3})\S+/;

const MAP_TAP_FIRST_DATE = new Date(2024, 5, 21);
const MAP_TAP_EMOJI = Array.from(
    '🤮🤮😭😱🤢😝😵🤬🥺🧊😒❄😥🙈😪😴🥶😶😕😞😨😟🫣😔🤫🤨😑😐🫢🙃🙂😁😂🤗🌞👏✨🌟😁🎓🎉👑🏆🏅🔥🎯'
);

const BASE_IMAGE_SIZE = { width: 270, height: 270 };

const TWO_DAYS_MILLISECONDS = 2 * 24 * 60 * 60 * 1000;
const JANUARY = 0;
const DECEMBER = 11;

const config = new Conf();

export class MapTapParseError extends Error {}

export class MapTapInvalidScoreDateError extends Error {}

export class ParsedMapTapScore {
    constructor(
        public readonly date: Date,
        public readonly firstRound: number,
        public readonly secondRound: number,
        public readonly thirdRound: number,
        public readonly fourthRound: number,
        public readonly fifthRound: number
    ) {}
}

export function getChannel(): string {
    const channel = config.get('maptap.channel');
    return typeof channel === 'string' ? channel : '0';
}

export function getEnabled(): boolean {
    const enabled = config.get('maptap.enabled');
    return typeof enabled === 'boolean' ? enabled : false;
}

function dateStringToDate(dateString: string, year: number): Date {
    const timestamp = Date.parse(`${dateString} ${year}`);
    if (isNaN(timestamp)) {
        throw new MapTapParseError(`Invalid date string: "${dateString}"`);
    }
    const parsedDate = new Date(timestamp);
    return new Date(
        Date.UTC(
            parsedDate.getFullYear(),
            parsedDate.getMonth(),
            parsedDate.getDate()
        )
    );
}

function isValidScore(score: number): boolean {
    return !isNaN(score) && score >= 0 && score <= 100;
}

function parseMapTapScoreInternal(
    scoreString: string,
    year: number
): ParsedMapTapScore {
    const match = scoreString.match(MAPTAP_SCORE_REGEX);
    if (!match) {
        throw new MapTapParseError(
            'Score string did not match expected format'
        );
    }

    const [
        ,
        date,
        firstScore,
        secondScore,
        thirdScore,
        fourthScore,
        fifthScore,
    ] = match;

    const parsedScore = new ParsedMapTapScore(
        dateStringToDate(date, year),
        parseInt(firstScore, 10),
        parseInt(secondScore, 10),
        parseInt(thirdScore, 10),
        parseInt(fourthScore, 10),
        parseInt(fifthScore, 10)
    );
    const scoreProperties = [
        'firstRound',
        'secondRound',
        'thirdRound',
        'fourthRound',
        'fifthRound',
    ] as const;
    for (const property of scoreProperties) {
        if (!isValidScore(parsedScore[property])) {
            throw new MapTapParseError(
                `Invalid score for ${property}: ${parsedScore[property]}`
            );
        }
    }
    return parsedScore;
}

function isWithinTwoDays(first: Date, second: Date): boolean {
    const diffInMs = Math.abs(first.getTime() - second.getTime());
    return diffInMs <= TWO_DAYS_MILLISECONDS;
}

export function isMapTapScoreString(scoreString: string): boolean {
    return MAPTAP_SCORE_REGEX.test(scoreString);
}

export function parseMapTapScoreForDate(
    scoreString: string,
    date: Date
): ParsedMapTapScore {
    return parseMapTapScoreInternal(scoreString, date.getUTCFullYear());
}

export function parseMapTapScoreForManualSubmission(
    scoreString: string
): ParsedMapTapScore {
    const currentDate = utcToday();
    const score = parseMapTapScoreForDate(scoreString, currentDate);
    if (isWithinTwoDays(score.date, currentDate)) {
        return score;
    }
    if (
        currentDate.getMonth() === JANUARY &&
        score.date.getMonth() === DECEMBER
    ) {
        score.date.setFullYear(score.date.getFullYear() - 1);
        if (isWithinTwoDays(score.date, currentDate)) {
            return score;
        }
    } else if (
        currentDate.getMonth() === DECEMBER &&
        score.date.getMonth() === JANUARY
    ) {
        score.date.setFullYear(score.date.getFullYear() + 1);
        if (isWithinTwoDays(score.date, currentDate)) {
            return score;
        }
    }
    throw new MapTapInvalidScoreDateError('Score is too old or in the future');
}

export function getTotalScoresMap(scores: MapTapScore[]): Map<string, number> {
    const scoresMap = new Map<string, number>();
    for (const score of scores) {
        if (scoresMap.has(score.user)) {
            scoresMap.set(
                score.user,
                scoresMap.get(score.user)! + score.getFinalScore()
            );
        } else {
            scoresMap.set(score.user, score.getFinalScore());
        }
    }
    return scoresMap;
}

async function parseAllMapTapMessagesForDate(
    client: Bot,
    mapTapChannel: SendableChannels,
    date: Date
) {
    const nextDay = addDaysToDate(date, 1);
    const yesterdayMessages = await mapTapChannel.messages
        .fetch({ after: dateToSnowflake(addDaysToDate(date, -1)) })
        .then((messages) =>
            messages.filter((message) => {
                if (message.createdAt < date || message.createdAt >= nextDay) {
                    return false;
                }
                return true;
            })
        );
    for (const message of yesterdayMessages.values()) {
        if (!isMapTapScoreString(message.content)) {
            continue;
        }
        const parsedScore = parseMapTapScoreForDate(message.content, date);
        try {
            const score = await client.database.insertMapTapScore(
                message.author.id,
                parsedScore.date,
                parsedScore.firstRound,
                parsedScore.secondRound,
                parsedScore.thirdRound,
                parsedScore.fourthRound,
                parsedScore.fifthRound
            );
            client.logger?.info(
                `Saving MapTap score for user ${message.author.username} (${message.author.id}) with score ${score.getFinalScore()} for date ${date.toISOString().split('T')[0]}`
            );
        } catch (error) {
            if (
                error instanceof Error &&
                error.name === 'SequelizeUniqueConstraintError'
            ) {
                client.logger?.warn(
                    `Score for user ${message.author.username} (${message.author.id}) for date ${date.toISOString().split('T')[0]} already exists in the database, skipping...`
                );
                continue;
            }
            throw error;
        }
    }
}

function getMapTapNumberForDate(date: Date): number {
    return daysBetweenDates(MAP_TAP_FIRST_DATE, date) - 1;
}

function formatDateForMapTap(date: Date): string {
    return date.toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
}

function generateMapTapSummaryMessage(allScores: MapTapScore[], date: Date) {
    const topScore = allScores[0]?.getFinalScore() ?? 0;
    const topScorers = allScores.filter(
        (score) => score.getFinalScore() === topScore
    );
    const remainingScores = allScores.filter(
        (score) => score.getFinalScore() !== topScore
    );
    const scoreToBucket: Map<number, MapTapScore[]> = new Map();
    for (const score of remainingScores) {
        const finalScore = score.getFinalScore();
        const bucket = Math.floor(finalScore / 100) * 100;
        if (!scoreToBucket.has(bucket)) {
            scoreToBucket.set(bucket, []);
        }
        scoreToBucket.get(bucket)!.push(score);
    }
    const topScoreSummary = `👑 ${topScore}: ${topScorers.map((score) => `<@${score.user}>`).join(', ')}`;
    const remainingScoresSummary = Array.from(scoreToBucket.entries())
        .map(
            ([bucket, scores]) =>
                `${bucket}-${bucket + 99}: ${scores.map((score) => `<@${score.user}>`).join(', ')}`
        )
        .join('\n');
    return `MapTap #${getMapTapNumberForDate(date)} scores (${formatDateForMapTap(date)}):\n${topScoreSummary}\n${remainingScoresSummary}`;
}

async function getMapTapSummaryTemplate(): Promise<string> {
    const template = await promisify(readFile)(
        'assets/maptap-summary-template.html',
        {
            encoding: 'utf-8',
        }
    );
    return template;
}

function getMapTapSummaryImageWidth(scoreCount: number): number {
    let multiplier = 0;
    switch (scoreCount) {
        case 1:
            break;
        case 2:
            multiplier = 1;
            break;
        default:
            multiplier = scoreCount <= 9 ? 2 : 3;
    }
    return BASE_IMAGE_SIZE.width + 222 * multiplier;
}

function getMapTapSummaryImageHeight(scoreCount: number): number {
    const entriesPerRow = scoreCount <= 9 ? 3 : 4;
    return (
        BASE_IMAGE_SIZE.height +
        182 * Math.ceil((scoreCount - entriesPerRow) / entriesPerRow)
    );
}

async function generateMapTapSummaryImage(
    client: Bot,
    allScores: MapTapScore[],
    date: Date
): Promise<Buffer | null> {
    const scoresForTemplate = await Promise.all(
        allScores.map(async (score) => ({
            avatar:
                client.users.cache
                    .get(score.user)
                    ?.displayAvatarURL({ size: 128 }) ||
                (await client.users
                    .fetch(score.user)
                    .then((user) => user.displayAvatarURL({ size: 128 }))),
            firstRound: score.firstRound,
            secondRound: score.secondRound,
            thirdRound: score.thirdRound,
            fourthRound: score.fourthRound,
            fifthRound: score.fifthRound,
            finalScore: score.getFinalScore(),
        }))
    );

    const image = await nodeHtmlToImage(
        {
            html: await getMapTapSummaryTemplate(),
            content: {
                width: getMapTapSummaryImageWidth(scoresForTemplate.length),
                height: getMapTapSummaryImageHeight(scoresForTemplate.length),
                number: getMapTapNumberForDate(date),
                date: formatDateForMapTap(date),
                scores: scoresForTemplate,
            },
            handlebarsHelpers: {
                roundScoreToEmoji: (round: number, score: number) => {
                    // MapTap emoji selection logic taken from website JS
                    const numEmojis = MAP_TAP_EMOJI.length;
                    let index = Math.floor((score / 100) * numEmojis);
                    if (index === 0) {
                        index += round + date.getUTCDate();
                    }
                    return MAP_TAP_EMOJI[index] || '🤯';
                },
            },
        } as any // NOTE: node-html-to-image's typings are broken and don't support their own arguments, so we have to cast to any here
    );
    if (!(image instanceof Buffer)) {
        client.logger?.error(
            'Failed to generate MapTap summary image, result is not a buffer??'
        );
        return null;
    }
    return image;
}

async function publishMapTapScoreSummaryForDate(
    client: Bot,
    date: Date,
    mapTapChannel: SendableChannels
) {
    const allScores = (await client.database.getMapTapScoresForDate(date)).sort(
        (a, b) => b.getFinalScore() - a.getFinalScore()
    );
    if (allScores.length === 0) {
        client.logger?.info(
            `No MapTap scores found for date ${date.toISOString().split('T')[0]}, skipping summary message...`
        );
        return;
    }
    const summaryMessage = generateMapTapSummaryMessage(allScores, date);
    const mapTapSummaryImage = await generateMapTapSummaryImage(
        client,
        allScores,
        date
    );
    await mapTapChannel.send({
        content: summaryMessage,
        files: mapTapSummaryImage
            ? [
                  new AttachmentBuilder(mapTapSummaryImage).setName(
                      `maptap-summary-${getMapTapNumberForDate(date)}.png`
                  ),
              ]
            : [],
        allowedMentions: { parse: [] },
    });
}

export async function runMapTapJobForDate(
    client: Bot,
    date: Date,
    mapTapChannel: SendableChannels
) {
    await parseAllMapTapMessagesForDate(client, mapTapChannel, date);
    await publishMapTapScoreSummaryForDate(
        client,
        midnightUTCDateForDate(date),
        mapTapChannel
    );
}
