import { Snowflake } from 'discord.js';
import { Op } from 'sequelize';
import { MapTapScore } from './models/MapTapScore';

export async function getAllMapTapScores(): Promise<MapTapScore[]> {
    return await MapTapScore.findAll({});
}

export async function getAllMapTapScoresBeforeOrAtDate(
    cutoffDate: Date
): Promise<MapTapScore[]> {
    return await MapTapScore.findAll({
        where: { date: { [Op.lte]: cutoffDate } },
    });
}

export async function getMapTapScoresForUser(
    user: string
): Promise<MapTapScore[]> {
    return await MapTapScore.findAll({ where: { user: user } });
}

export async function getMapTapScoresForDate(
    date: Date
): Promise<MapTapScore[]> {
    return await MapTapScore.findAll({ where: { date: date } });
}

export async function insertMapTapScore(
    user: Snowflake,
    date: Date,
    firstRound: number,
    secondRound: number,
    thirdRound: number,
    fourthRound: number,
    fifthRound: number
): Promise<MapTapScore> {
    return MapTapScore.create({
        user: user,
        date: date,
        firstRound: firstRound,
        secondRound: secondRound,
        thirdRound: thirdRound,
        fourthRound: fourthRound,
        fifthRound: fifthRound,
    });
}
