import Conf from 'conf';
import Bot from '../../client/Bot';
import { AttachmentBuilder, Guild, SendableChannels } from 'discord.js';
import { promisify } from 'util';
import { readFile } from 'fs/promises';
import path from 'path';
import { renderImageFromHtmlTemplate } from '../../utils/ImageUtils';
import { fetchWithRetry } from '../../utils/FetchUtils';
import { getAllRNGdleUsernames, insertRNGdleRoll } from './RNGdleQueries';
import { midnightUTCDateForDate } from '../../utils/DateUtils';
import { formatDateAsLongMonthString } from '../../utils/StringUtils';

const RNGDLE_API_URL = 'https://www.rngdle.com/api/';

interface RNGdleAPIRoll {
    id: string;
    number: number;
    totalScore: number;
    badgeCount: number;
    rolledAt: string;
    heartCount: number;
    activityId: string;
    poem?: string;
}

interface RNGdleAPIResponse {
    rolls: RNGdleAPIRoll[];
}

const RNGDLE_SCORE_API_URL = process.env.RNGDLE_SCORE_API_URL;
if (RNGDLE_SCORE_API_URL === undefined) {
    throw new Error('RNGDLE_SCORE_API_URL environment variable is not set');
}

type RNGdleRarity =
    'trash' | 'common' | 'uncommon' | 'rare' | 'epic' | 'anomaly' | 'mythic';

interface RNGdleScoreAPIBadge {
    id: string;
    label: string;
    emoji: string;
    ep: number;
    rarity: Capitalize<RNGdleRarity>;
    desc: string;
    prob: number;
}

interface RNGdleScoreAPIResponse {
    number: number;
    totalEP: number;
    count: number;
    badges: RNGdleScoreAPIBadge[];
    percentile: number;
    tier: RNGdleRarity;
}

type RNGdleScoreBadge = Omit<RNGdleScoreAPIBadge, 'rarity'> & {
    rarity: RNGdleRarity;
};

interface RNGdleScore {
    user: string;
    number: number;
    score: number;
    badges: RNGdleScoreBadge[];
    poem?: string;
    percentile: number;
    rarity: RNGdleRarity;
}

const BASE_IMAGE_SIZE = { width: 620, height: 620 };

const config = new Conf();

async function getRNGdleRollsForUserFromAPI(
    user: string
): Promise<RNGdleAPIResponse> {
    const response = await fetchWithRetry(
        `${RNGDLE_API_URL}/users/${user}/rolls`
    );
    if (!response.ok) {
        throw new Error(`Failed to fetch RNGdle rolls: ${response.status}`);
    }
    return response.json();
}

async function getRNGdleScoreFromAPI(
    score: number
): Promise<RNGdleScoreAPIResponse> {
    const response = await fetchWithRetry(`${RNGDLE_SCORE_API_URL}?n=${score}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch RNGdle score: ${response.status}`);
    }
    return response.json();
}

async function getRNGdleScoreForAPIResponse(
    user: string,
    rngdleAPIResponse: RNGdleAPIRoll
): Promise<RNGdleScore> {
    const scoreResponse = await getRNGdleScoreFromAPI(rngdleAPIResponse.number);
    if (
        scoreResponse.totalEP !== rngdleAPIResponse.totalScore ||
        scoreResponse.count !== rngdleAPIResponse.badgeCount
    ) {
        throw new Error(`Score mismatch for roll ${rngdleAPIResponse.id}`);
    }
    return {
        user: user,
        number: rngdleAPIResponse.number,
        score: rngdleAPIResponse.totalScore,
        badges: scoreResponse.badges.map(
            (badge) =>
                ({
                    ...badge,
                    rarity: badge.rarity.toLowerCase(),
                }) as RNGdleScoreBadge
        ),
        poem: rngdleAPIResponse.poem,
        percentile: scoreResponse.percentile,
        rarity: scoreResponse.tier,
    };
}

function rngdleScoreToSummaryString(score: RNGdleScore): string {
    return `<@${score.user}> (${score.number}, ${score.score.toLocaleString()} EP)`;
}

function generateRNGdleSummaryMessage(allScores: RNGdleScore[], date: Date) {
    const topScore = allScores[0]?.score ?? 0;
    const topScorers = allScores.filter((score) => score.score === topScore);
    const remainingScores = allScores.filter(
        (score) => score.score !== topScore
    );
    const scoreToBucket: Map<RNGdleRarity, RNGdleScore[]> = new Map();
    for (const score of remainingScores) {
        if (!scoreToBucket.has(score.rarity)) {
            scoreToBucket.set(score.rarity, []);
        }
        scoreToBucket.get(score.rarity)!.push(score);
    }
    const topScoreSummary = `👑 ${allScores[0]?.rarity.toUpperCase()}: ${topScorers
        .map(rngdleScoreToSummaryString)
        .join(', ')}`;
    const remainingScoresSummary = Array.from(scoreToBucket.entries())
        .map(
            ([bucket, scores]) =>
                `${bucket.toUpperCase()}: ${scores
                    .map(rngdleScoreToSummaryString)
                    .join(', ')}`
        )
        .join('\n');
    return `RNGdle scores (${formatDateAsLongMonthString(
        date
    )}):\n${topScoreSummary}\n${remainingScoresSummary}`;
}

async function insertRNGdleRollForUserFromScore(
    client: Bot,
    id: string,
    user: string,
    date: Date,
    score: RNGdleScore
) {
    try {
        const roll = await insertRNGdleRoll(
            user,
            id,
            date,
            score.number,
            score.score
        );
        client.logger?.info(
            `Saving RNGdle roll for user ${user} with score ${roll.ep} for date ${roll.date.toISOString().split('T')[0]}`
        );
    } catch (error) {
        if (
            error instanceof Error &&
            error.name === 'SequelizeUniqueConstraintError'
        ) {
            client.logger?.warn(
                `Roll for user ${user} for date ${
                    date.toISOString().split('T')[0]
                } already exists in the database, skipping...`
            );
            return;
        }
        throw error;
    }
}

async function getRNGdleScoresForDate(
    client: Bot,
    date: Date
): Promise<RNGdleScore[]> {
    const allUsers = await getAllRNGdleUsernames();
    const allScores: RNGdleScore[] = [];
    for (const user of allUsers) {
        try {
            const rollsResponse = await getRNGdleRollsForUserFromAPI(
                user.rngdleUsername
            );
            const rollForDate = rollsResponse.rolls.find((roll) => {
                const rolledDate = midnightUTCDateForDate(
                    new Date(roll.rolledAt)
                );
                return rolledDate.getTime() === date.getTime();
            });
            if (rollForDate) {
                const score = await getRNGdleScoreForAPIResponse(
                    user.user,
                    rollForDate
                );
                await insertRNGdleRollForUserFromScore(client, rollForDate.id, user.user, date, score);
                allScores.push(score);
            }
        } catch (error) {
            client.logger?.error(
                `Error fetching RNGdle score for user ${user.user}: ${error}`
            );
        }
    }
    return allScores;
}

async function getRNGdleSummaryTemplate(): Promise<string> {
    return readFile(
        path.join(__dirname, 'assets', 'rngdle-summary-template.html'),
        {
            encoding: 'utf-8',
        }
    );
}

function getRNGdleSummaryImageWidth(scoreCount: number): number {
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
    return BASE_IMAGE_SIZE.width + 596 * multiplier;
}

function getRNGdleSummaryImageHeight(scoreCount: number): number {
    const entriesPerRow = scoreCount <= 9 ? 3 : 4;
    return (
        BASE_IMAGE_SIZE.height +
        506 * Math.ceil((scoreCount - entriesPerRow) / entriesPerRow)
    );
}

function getPercentileAsString(percentile: number): string {
    const isTop = percentile >= 50;
    const percentage = Math.round(isTop ? 100 - percentile : percentile);
    return `${isTop ? 'Top' : 'Bottom'} ${0 === percentage ? '<1' : percentage}%`;
}

async function generateRNGdleSummaryImage(
    client: Bot,
    allScores: RNGdleScore[],
    date: Date,
    guild: Guild
): Promise<Buffer | null> {
    const scoresForTemplate = await Promise.all(
        allScores.map(async (score) => {
            const sortedBadges = score.badges.sort((a, b) => b.ep - a.ep);
            const topThreeBadges = sortedBadges.slice(0, 3);
            const remainingBadgeEmoji = sortedBadges
                .slice(3)
                .map((badge) => badge.emoji.trim())
                .join('');
            return {
                avatar:
                    guild.members.cache
                        .get(score.user)
                        ?.displayAvatarURL({ size: 128 }) ||
                    (await guild.members
                        .fetch(score.user)
                        .then((member) =>
                            member.displayAvatarURL({ size: 128 })
                        )),
                number: score.number,
                totalEP: score.score,
                percentile: getPercentileAsString(score.percentile),
                rarity: score.rarity,
                poem: score.poem,
                topBadges: topThreeBadges,
                remainingBadgeEmoji: remainingBadgeEmoji,
            };
        })
    );

    return renderImageFromHtmlTemplate(await getRNGdleSummaryTemplate(), {
        date: formatDateAsLongMonthString(date),
        scores: scoresForTemplate,
        width: getRNGdleSummaryImageWidth(allScores.length),
        height: getRNGdleSummaryImageHeight(allScores.length),
    });
}

async function publishRNGdleScoreSummaryForDate(
    client: Bot,
    date: Date,
    rngdleChannel: SendableChannels,
    guild: Guild
) {
    const isoDate = date.toISOString().split('T')[0];
    const allScores = (await getRNGdleScoresForDate(client, date)).sort(
        (a, b) => b.score - a.score
    );
    if (allScores.length === 0) {
        client.logger?.info(
            `No RNGdle scores found for date ${
                isoDate
            }, skipping summary message...`
        );
        return;
    }
    const summaryMessage = generateRNGdleSummaryMessage(allScores, date);
    const rngdleSummaryImage = await generateRNGdleSummaryImage(
        client,
        allScores,
        date,
        guild
    );
    await rngdleChannel.send({
        content: summaryMessage,
        files: rngdleSummaryImage
            ? [
                  new AttachmentBuilder(rngdleSummaryImage).setName(
                      `rngdle-summary-${isoDate}.png`
                  ),
              ]
            : [],
        allowedMentions: { parse: [] },
    });
}
export function runRNGdleJobForDate(
    client: Bot,
    date: Date,
    rngdleChannel: SendableChannels,
    guild: Guild
) {
    return publishRNGdleScoreSummaryForDate(
        client,
        midnightUTCDateForDate(date),
        rngdleChannel,
        guild
    );
}

export function getChannel(): string {
    const channel = config.get('rngdle.channel');
    return typeof channel === 'string' ? channel : '0';
}

export function getEnabled(): boolean {
    const enabled = config.get('rngdle.enabled');
    return typeof enabled === 'boolean' ? enabled : false;
}

export function getDebug(): boolean {
    const debug = config.get('rngdle.debug');
    return typeof debug === 'boolean' ? debug : false;
}
