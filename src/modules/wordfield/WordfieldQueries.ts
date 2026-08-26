import { Snowflake } from 'discord.js';
import { MessageCount } from './models/MessageCount';

export async function incrementMessageCount(user: Snowflake): Promise<void> {
    await MessageCount.findOrCreate({ where: { id: user } }).then(
        async ({ 0: instance }) => {
            instance.count += 1;
            await instance.save();
        }
    );
}

export async function clearAllMessageCounts(): Promise<void> {
    await MessageCount.update({ count: 0 }, { where: {} });
}

export async function getMessageCount(user: Snowflake): Promise<number> {
    const instance = await MessageCount.findOne({ where: { id: user } });
    if (instance) {
        return instance.count;
    }
    return 0;
}
