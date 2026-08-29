import { Snowflake } from 'discord.js';
import { RNGdleUsername } from './models/RNGdleUsernames';

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
