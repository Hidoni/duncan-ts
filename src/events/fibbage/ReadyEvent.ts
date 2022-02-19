import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import schedule from 'node-schedule';
import { getEnabled, promptUsersWithQuestions } from '../../utils/FibbageUtils';

export const name: string = 'ready';
export const handler: EventHandler = async (client: Bot) => {
    let rule = new schedule.RecurrenceRule(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
    );
    rule.tz = 'America/New_York';
    client.logger?.debug(
        `Setting up the Fibbage job, first invocation at ${rule.nextInvocationDate(
            new Date()
        )}`
    );
    schedule.scheduleJob(rule, async () => {
        // Resolve existing questions in channel
        // Post new questions
        // Prompt users for fibs for answered questions
        // Prompt users for new questions
        promptUsersWithQuestions(client);
    });
};
export const once: boolean = true;
export const shoudLoad = getEnabled;
