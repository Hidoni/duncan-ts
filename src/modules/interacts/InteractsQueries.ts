import { Op, TimeoutError } from 'sequelize';
import { CommandUsage } from './models/CommandUsage';

export async function newCommandUsage(
    userId: string,
    commandName: string
): Promise<CommandUsage> {
    return CommandUsage.create({
        user: userId,
        commandName: commandName,
        usedAt: new Date(),
    });
}

export async function createCommandUsageIfDoesntExist(
    userId: string,
    commandName: string,
    usedAt: Date
): Promise<CommandUsage> {
    try {
        return await CommandUsage.findOrCreate({
            where: {
                user: userId,
                commandName: commandName,
                usedAt: usedAt,
            },
        }).then(([instance, _created]) => instance);
    } catch (error) {
        if (error instanceof TimeoutError) {
            return createCommandUsageIfDoesntExist(userId, commandName, usedAt);
        }
        throw error;
    }
}

export async function getCommandUsageByUserSince(
    userId: string,
    commandName: string,
    since: Date
): Promise<number> {
    return CommandUsage.count({
        where: {
            user: userId,
            commandName: commandName,
            usedAt: { [Op.gte]: since },
        },
    });
}

export async function getAllCommandUsageByUser(
    userId: string,
    commandName: string
): Promise<number> {
    return CommandUsage.count({
        where: { user: userId, commandName: commandName },
    });
}
