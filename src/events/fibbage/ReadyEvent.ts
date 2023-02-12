import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import schedule from 'node-schedule';
import {
    isFibbageOnBreak,
    getEnabled,
    postNewQuestions,
    promptUsersForFibs,
    promptUsersWithQuestions,
    remindUsersToAnswerQuestions,
    showResultsForQuestions,
} from '../../utils/FibbageUtils';

export const name: string = 'ready';
export const handler: EventHandler = async (client: Bot) => {
    let rule = new schedule.RecurrenceRule(
        undefined,
        undefined,
        undefined,
        undefined,
        [0, 12],
        0,
        0
    );
    rule.tz = 'America/New_York';
    client.logger?.info(
        `Setting up the Fibbage job, first invocation at ${rule.nextInvocationDate(
            new Date()
        )}`
    );
    schedule.scheduleJob(rule, async () => {
        // Resolve existing questions in channel
        await showResultsForQuestions(client);
        if (!isFibbageOnBreak()) {
            // Post new questions
            await postNewQuestions(client);
            // Prompt users for fibs for answered questions
            await promptUsersForFibs(client);
            // Remind users to answer questions
            await remindUsersToAnswerQuestions(client);
            // Prompt users for new questions
            await promptUsersWithQuestions(client);
        } else {
            client.logger?.debug(
                'Fibbage is currently on break, skipping new questions'
            );
        }
    });
};
export const once: boolean = true;
export const shouldLoad = getEnabled;
