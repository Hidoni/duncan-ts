import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import schedule from 'node-schedule';
import { GuildMember } from 'discord.js';
import {
    getEnabled,
    getUsersWithWordfieldRole,
} from '../../utils/WordfieldUtils';

const JAKEMI_USER_ID = '381002402947399691';

async function generateWeeklyReport(client: Bot) {
    const participants = await getUsersWithWordfieldRole(client);
    const counts = (
        await Promise.all(
            participants.map(async function (
                participant
            ): Promise<[GuildMember, number]> {
                return [
                    participant,
                    await client.database.getMessageCount(participant.id),
                ];
            })
        )
    ).sort((a, b) => a[0].user.username.localeCompare(b[0].user.username));
    return `Weekly report for Wordfield:\n${counts
        .map((value) => `${value[0].user.username}: ${value[1]}`)
        .join('\n')}`;
}

export const name: string = 'ready';
export const handler: EventHandler = async (client: Bot) => {
    let rule = new schedule.RecurrenceRule(
        undefined,
        undefined,
        undefined,
        0, // Sunday
        23,
        0,
        0
    );
    rule.tz = 'America/Los_Angeles';
    client.logger?.info(
        `Setting up the Wordfield job, first invocation at ${rule.nextInvocationDate(
            new Date()
        )}`
    );
    schedule.scheduleJob(rule, async () => {
        client.logger?.info('Sending report on message counts for the week');
        (await client.users.fetch(JAKEMI_USER_ID)).send(
            await generateWeeklyReport(client)
        );
        client.logger?.info('Clearing all tracked message counts');
        await client.database.clearAllMessageCounts();
    });
};
export const once: boolean = true;
export const shouldLoad = getEnabled;
