import Bot from '../../client/Bot';
import { EventHandler } from '../../interfaces/Event';
import schedule from 'node-schedule';
import {
    changeQuestion,
    getDays,
    setDays,
} from '../../utils/QuestionOfTheDayUtils';

export const name: string = 'ready';
export const handler: EventHandler = async (client: Bot) => {
    let rule = new schedule.RecurrenceRule(
        undefined,
        undefined,
        undefined,
        undefined,
        12,
        0,
        0
    );
    rule.tz = 'America/New_York';
    client.logger?.debug(
        `Setting up the Question Of The Day job, first invocation at ${rule.nextInvocationDate(
            new Date()
        )}`
    );
    schedule.scheduleJob(rule, async () => {
        setDays(getDays() + 1);
        changeQuestion(client);
    });
};
export const once: boolean = true;
