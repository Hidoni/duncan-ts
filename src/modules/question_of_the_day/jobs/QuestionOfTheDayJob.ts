import { RecurrenceRule } from 'node-schedule';
import Bot from '../../../client/Bot';
import { ScheduledJobHandler } from '../../../interfaces/ScheduledJob';
import {
    changeQuestion,
    getDays,
    getEnabled,
    setDays,
} from '../QuestionOfTheDayUtils';

export const name: string = 'Question Of The Day';

export const rule = new RecurrenceRule(
    undefined,
    undefined,
    undefined,
    [1, 3, 5, 6], // Monday, Wednesday, Friday and Saturday
    12,
    0,
    0
);
rule.tz = 'America/New_York';

export const handler: ScheduledJobHandler = async (client: Bot) => {
    setDays(getDays() + 1);
    changeQuestion(client);
};

export const shouldLoad = getEnabled;
