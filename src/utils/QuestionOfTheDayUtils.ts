import Conf from 'conf';
import { Message, TextChannel } from 'discord.js';
import Bot from '../client/Bot';

const FLURRY_OF_QUESTIONS_MESSAGE =
    'Flurry of Questions Mode!\n\nAsk any (serious) question and the person below has to answer it. Then they add their own question and the cycle continues.';
const JAKEMI_USER_ID = '381002402947399691';
const config = new Conf();

export function getDays(): number {
    const days = config.get('qotd.days');
    return typeof days === 'number' ? days : 0;
}

export function setDays(days: number) {
    config.set('qotd.days', days);
}

export function getChannel(): string {
    const channel = config.get('qotd.channel');
    return typeof channel === 'string' ? channel : '0';
}

export function setChannel(channel: string) {
    config.set('qotd.channel', channel);
}

export function capitalizeQuestion(question: string) {
    return question.charAt(0).toUpperCase() + question.slice(1).toLowerCase();    
}

function isFriday() {
    const today = new Date();
    return today.getDay() === 5;
}

function daysSinceDate(date: Date) {
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function changeQuestion(client: Bot) {
    client.logger?.debug('Changing question of the day...');
    const channel = await client.channels.fetch(getChannel()).catch(() => undefined);
    if (!channel) {
        throw new Error(`Channel ${getChannel()} not found`);
    }
    if (!(channel instanceof TextChannel)) {
        throw new Error(`Channel ${getChannel()} is not a text channel`);
    }
    let message = `**QotD #${getDays()}: {}**`;
    if (isFriday()) {
        message = message.replace('{}', FLURRY_OF_QUESTIONS_MESSAGE);
    } else {
        const question = await client.database.getRandomQuestion();
        if (question) {
            message = message.replace('{}', question.question);
            client.logger?.info(
                `Using question "${question.question}" by ${
                    question.authorName
                } after ${daysSinceDate(question.addedAt)} days.`
            );
            question.used = true;
            question.save();
        } else {
            message = message.replace('{}', FLURRY_OF_QUESTIONS_MESSAGE);
        }
    }
    await channel.send(message).then(async (msg: Message) => {
        await (channel as TextChannel).messages
            .fetchPinned()
            .then(async (messages) => {
                await messages.last()?.unpin();
                await msg.pin();
            })
            .catch(() =>
                client.logger?.debug(
                    'Failed to pin/unpin message, assuming intentional.'
                )
            );
    });
    await client.database.getUnusedQuestions().then((questions) => {
        if (questions.length <= 5) {
            client.users
                .fetch(JAKEMI_USER_ID)
                .then((user) => {
                    user.send(
                        `Just as a heads up, we're running low on QotD questions!! I only have ${questions.length} left!!`
                    );
                })
                .catch((error) =>
                    client.logger?.debug(
                        `Failed to send heads up message, error: ${error}`
                    )
                );
        }
    });
}
