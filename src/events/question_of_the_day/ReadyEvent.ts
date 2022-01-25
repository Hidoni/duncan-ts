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
    schedule.scheduleJob(
        { hour: 12, minute: 0, second: 0, tz: 'EST5EDT' },
        async () => {
            setDays(getDays() + 1);
            await changeQuestion(client);
        }
    );
};
export const once: boolean = true;
