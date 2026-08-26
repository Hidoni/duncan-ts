import { RecurrenceRule } from 'node-schedule';
import { GuildMember } from 'discord.js';
import Bot from '../../../client/Bot';
import { ScheduledJobHandler } from '../../../interfaces/ScheduledJob';
import { getEnabled, getUsersWithWordfieldRole } from '../WordfieldUtils';
import { clearAllMessageCounts, getMessageCount } from '../WordfieldQueries';

const JAKEMI_USER_ID = '381002402947399691';

async function generateWeeklyReport(client: Bot) {
    const participants = await getUsersWithWordfieldRole(client);
    const counts = (
        await Promise.all(
            participants.map(async function (participant): Promise<
                [GuildMember, number]
            > {
                return [participant, await getMessageCount(participant.id)];
            })
        )
    ).sort((a, b) => a[0].user.username.localeCompare(b[0].user.username));
    return `Weekly report for Wordfield:\n${counts
        .map((value) => `${value[0].user.username}: ${value[1]}`)
        .join('\n')}`;
}

export const name: string = 'Wordfield';

export const rule = new RecurrenceRule(
    undefined,
    undefined,
    undefined,
    0, // Sunday
    23,
    0,
    0
);
rule.tz = 'America/Los_Angeles';

export const handler: ScheduledJobHandler = async (client: Bot) => {
    client.logger?.info('Sending report on message counts for the week');
    (await client.users.fetch(JAKEMI_USER_ID)).send(
        await generateWeeklyReport(client)
    );
    client.logger?.info('Clearing all tracked message counts');
    await clearAllMessageCounts();
};

export const shouldLoad = getEnabled;
