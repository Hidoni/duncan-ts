import { Snowflake } from 'discord.js';
import { Name } from './models/Name';

export async function insertOrUpdateName(
    user: Snowflake,
    name: string
): Promise<void> {
    await Name.findOrCreate({
        where: {
            id: user,
        },
    }).then(async ({ 0: instance }) => {
        instance.name = name;
        await instance.save();
    });
}

export async function clearName(user: Snowflake): Promise<void> {
    const instance = await Name.findOne({ where: { id: user } });
    if (instance) {
        instance.name = null;
        await instance.save();
    }
}

export async function getName(user: Snowflake): Promise<string | null> {
    const instance = await Name.findOne({ where: { id: user } });
    if (instance) {
        return instance.name;
    }
    return null;
}
