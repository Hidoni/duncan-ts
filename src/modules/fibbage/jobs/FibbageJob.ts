import { RecurrenceRule } from 'node-schedule';
import Bot from '../../../client/Bot';
import { ScheduledJobHandler } from '../../../interfaces/ScheduledJob';
import {
    isFibbageOnBreak,
    getEnabled,
    postNewQuestions,
    promptUsersForFibs,
    promptUsersWithQuestions,
    remindUsersToAnswerQuestions,
    showResultsForQuestions,
} from '../FibbageUtils';

export const name: string = 'Fibbage';

export const rule = new RecurrenceRule(
    undefined,
    undefined,
    undefined,
    undefined,
    [0, 12],
    0,
    0
);
rule.tz = 'America/New_York';

export const handler: ScheduledJobHandler = async (client: Bot) => {
    await showResultsForQuestions(client);
    if (!isFibbageOnBreak()) {
        await postNewQuestions(client);
        await promptUsersForFibs(client);
        await remindUsersToAnswerQuestions(client);
        await promptUsersWithQuestions(client);
    } else {
        client.logger?.debug(
            'Fibbage is currently on break, skipping new questions'
        );
    }
};

export const shouldLoad = getEnabled;
