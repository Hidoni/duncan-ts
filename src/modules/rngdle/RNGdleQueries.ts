import { Snowflake } from 'discord.js';
import { RNGdleUsername } from './models/RNGdleUsernames';
import { RNGdleRoll } from './models/RNGdleRoll';
import { col, fn } from 'sequelize';

export async function getRNGdleUsernameForUser(
    user: string
): Promise<RNGdleUsername | null> {
    return await RNGdleUsername.findOne({ where: { user: user } });
}

export async function upsertRNGdleUsername(
    user: Snowflake,
    rngdleUsername: string
): Promise<RNGdleUsername> {
    return RNGdleUsername.findOrCreate({
        where: { user: user },
        defaults: { user: user, rngdleUsername: rngdleUsername },
    }).then(([instance, created]) => {
        if (!created) {
            return instance.update({ rngdleUsername: rngdleUsername });
        }
        return instance;
    });
}

export async function getAllRNGdleUsernames(): Promise<RNGdleUsername[]> {
    return RNGdleUsername.findAll();
}

export async function getAllRNGdleRolls(): Promise<RNGdleRoll[]> {
    return RNGdleRoll.findAll({
        order: [[col('ep'), 'DESC']]
    });
}

export async function getTopRNGdleRollForEachUser(): Promise<RNGdleRoll[]> {
    return RNGdleRoll.findAll({
        attributes: ['user', 'id', 'number', [fn('MAX', col('ep')), 'ep']],
        group: ['user'],
        order: [[col('ep'), 'DESC']],
    });
}

export async function getBottomRNGdleRollForEachUser(): Promise<RNGdleRoll[]> {
    return RNGdleRoll.findAll({
        attributes: ['user', 'id', 'number', [fn('MIN', col('ep')), 'ep']],
        group: ['user'],
        order: [[col('ep'), 'ASC']],
    });
}

export type TotalRNGdleEP = { user: string; totalEp: number };

export async function getTotalRNGdleEPForEachUser(): Promise<
    TotalRNGdleEP[]
> {
    return RNGdleRoll.findAll({
        attributes: ['user', [fn('SUM', col('ep')), 'totalEp']],
        group: ['user'],
        order: [[fn('SUM', col('ep')), 'DESC']],
        raw: true,
    }) as unknown as TotalRNGdleEP[];
}

export async function getAllRNGdleRollsForUser(
    user: Snowflake
): Promise<RNGdleRoll[]> {
    return RNGdleRoll.findAll({
        where: { user: user },
        order: [[col('date'), 'DESC']],
    });
}

export async function insertRNGdleRoll(
    user: Snowflake,
    id: string,
    date: Date,
    number: number,
    ep: number
): Promise<RNGdleRoll> {
    return RNGdleRoll.create({
        user: user,
        id: id,
        date: date,
        number: number,
        ep: ep,
    });
}