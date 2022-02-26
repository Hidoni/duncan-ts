import Conf from 'conf';
import {
    GuildMember,
    MessageActionRow,
    MessageButton,
    Modal,
    ModalActionRowComponent,
    Snowflake,
    TextBasedChannel,
    TextInputComponent,
    User,
} from 'discord.js';
import Bot from '../client/Bot';
import { FibbageAnswer } from '../database/models/FibbageAnswer';
import {
    FibbageQuestion,
    FibbageQuestionState,
} from '../database/models/FibbageQuestion';
import {
    FibbageDefaultAnswers,
    FibbagePrompt,
    FibbagePrompts,
} from '../interfaces/fibbage/FibbagePrompts';
import { FibbageScoreSummary } from '../interfaces/fibbage/FibbageScoreSummary';

const MAX_ALLOWED_CHARS_IN_BUTTON = 80;
const MAX_USERS_TO_PROMPT = 7;
const MAX_ANSWERS_ALLOWED = 8;
const ANSWER_BUTTONS_PER_ROW = 2;
const POINTS_FOR_CORRECT_GUESS = 1000;
const POINTS_FOR_OTHER_CORRECT_GUESS = 1000;
const POINTS_FOR_FOOLING_OTHERS = 500;

const config = new Conf();

export function getChannel(): string {
    const channel = config.get('fibbage.channel');
    return typeof channel === 'string' ? channel : '0';
}

export function setChannel(channel: string) {
    config.set('fibbage.channel', channel);
}

export function getRole(): string {
    const role = config.get('fibbage.role');
    return typeof role === 'string' ? role : '0';
}

export function setRole(role: string) {
    config.set('fibbage.role', role);
}

export function getGuild(): string {
    const guild = config.get('fibbage.guild');
    return typeof guild === 'string' ? guild : '0';
}

export function setGuild(guild: string) {
    config.set('fibbage.guild', guild);
}

export function getEnabled(): boolean {
    const enabled = config.get('fibbage.enabled');
    return typeof enabled === 'boolean' ? enabled : false;
}

export function getFibbagePrompts(): FibbagePrompts {
    const prompts = require('../../prompts.json') as FibbagePrompts;
    return prompts;
}

export function getRandomFibbagePrompt(): [string, FibbagePrompt] {
    return getRandomFibbagePromptFromOptions(getFibbagePrompts());
}

export function getRandomFibbagePromptFromOptions(
    prompts: FibbagePrompts
): [string, FibbagePrompt] {
    const keys = Object.keys(prompts);
    const random = Math.floor(Math.random() * keys.length);
    return [keys[random], prompts[keys[random]]];
}

export async function getUsersWithFibbageRole(
    client: Bot
): Promise<GuildMember[]> {
    const role = getRole();
    if (role === '0') {
        return [];
    }
    const guild = getGuild();
    if (guild === '0') {
        return [];
    }
    const guildObj = await client.guilds.fetch(guild).catch(() => undefined);
    if (!guildObj) {
        return [];
    }
    return guildObj.members
        .fetch()
        .then((members) =>
            members.filter((member) => member.roles.cache.has(role))
        )
        .then((members) => Array.from(members.values()))
        .catch((error) => {
            client.logger?.error(
                `Failed to fetch members with role ${role}, error: ${error}`
            );
            return [];
        });
}

export function generateQuestionModal(questionId: number) {
    return new Modal()
        .setTitle('Fibbage')
        .addComponents(
            new MessageActionRow<ModalActionRowComponent>().addComponents(
                new TextInputComponent()
                    .setLabel('Enter the truth: ')
                    .setPlaceholder(
                        'Be honest! Other players will have to guess this.'
                    )
                    .setMaxLength(MAX_ALLOWED_CHARS_IN_BUTTON)
                    .setRequired(true)
                    .setStyle('SHORT')
                    .setCustomId('fibbage_question_input')
            )
        )
        .setCustomId(`fibbage_question_modal_${questionId}`);
}

function generateComponentsRowForQuestion(questionId: number) {
    return new MessageActionRow().addComponents(
        new MessageButton()
            .setLabel('Answer Question!')
            .setStyle('PRIMARY')
            .setCustomId(`fibbage_question_button_${questionId}`),
        new MessageButton()
            .setLabel('Skip Question!')
            .setStyle('DANGER')
            .setCustomId(`fibbage_question_skip_${questionId}`)
    );
}

function escapeDiscordMarkdown(text: string) {
    return text.replace(/[\*_~`|]/g, '\\$&');
}

async function sendButtonPromptToUser(
    client: Bot,
    question: string,
    user: GuildMember | User
) {
    const dbQuestion = await client.database.insertFibbageQuestion(
        question,
        user.id
    );
    await user.send({
        content: escapeDiscordMarkdown(
            `Hewwo! ^w^\nI'm here to ask you your question for Fibbage!\n\n${question}`
        ),
        components: [generateComponentsRowForQuestion(dbQuestion.id)],
    });
}

function getUserTag(user: User | GuildMember) {
    return user instanceof GuildMember ? user.user.tag : user.tag;
}

export async function giveUserNewQuestion(
    client: Bot,
    questions: string[],
    user: GuildMember | User
) {
    const question = questions[Math.floor(Math.random() * questions.length)];
    client.logger?.info(
        `Giving ${getUserTag(user)} a new question: ${question}`
    );
    await sendButtonPromptToUser(client, question, user);
}

function getUnaskedQuestionsForUser(
    askedQuestions: FibbageQuestion[],
    user: GuildMember | User
) {
    const prompts = getFibbagePrompts();
    const allAskedUserQuestions = askedQuestions.filter(
        (question) => question.user === user.id
    );
    const unaskedPrompts = Object.keys(prompts).filter(
        (prompt) =>
            !allAskedUserQuestions.some(
                (question) => question.question === prompt
            )
    );
    const promptList =
        unaskedPrompts.length > 0 ? unaskedPrompts : Object.keys(prompts);
    return promptList;
}

export async function promptUserWithQuestion(
    client: Bot,
    user: GuildMember | User,
    askedQuestions: FibbageQuestion[]
) {
    const unaskedQuestions = getUnaskedQuestionsForUser(askedQuestions, user);
    await giveUserNewQuestion(client, unaskedQuestions, user);
}

export async function promptUsersWithQuestions(client: Bot) {
    const users = await getUsersWithFibbageRole(client);
    if (users.length === 0) {
        return;
    }
    const askedQuestions = await client.database.getAllFibbageQuestions();
    const usersWithQuestion = askedQuestions
        .filter(
            (question) =>
                question.state != FibbageQuestionState.DONE &&
                question.state != FibbageQuestionState.SKIPPED
        )
        .map((question) => {
            return question.user;
        });
    const usersWithoutQuestion = users.filter(
        (user) => !usersWithQuestion.includes(user.id)
    );
    if (usersWithoutQuestion.length === 0) {
        return;
    }
    for (const user of usersWithoutQuestion) {
        promptUserWithQuestion(client, user, askedQuestions);
    }
}

function generateComponentsRowForPrompt(questionId: number) {
    return new MessageActionRow().addComponents(
        new MessageButton()
            .setLabel('Submit a Lie!')
            .setStyle('PRIMARY')
            .setCustomId(`fibbage_prompt_button_${questionId}`)
    );
}

async function sendButtonWithPromptToUser(
    question: FibbageQuestion,
    prompt: string,
    user: GuildMember | User
) {
    await user.send({
        content: escapeDiscordMarkdown(
            `Hewwo! ^w^\nI need you to put a clever lie to this question that may fool other players!\n\n${prompt}`
        ),
        components: [generateComponentsRowForPrompt(question.id)],
    });
}

async function promptRandomUsersForFibs(
    client: Bot,
    question: FibbageQuestion,
    users: (GuildMember | User)[]
) {
    const questionUser = await client.users.fetch(question.user);
    const prompt = getFibbagePrompts()[question.question];
    const promptFormatted = prompt.prompt.replace(/\{0}/g, questionUser.tag);

    let usersCopy = users.slice();
    const amountToPrompt =
        users.length > MAX_USERS_TO_PROMPT ? MAX_USERS_TO_PROMPT : users.length;
    client.logger?.debug(
        `Prompting ${amountToPrompt} users for fibs for question ${question.id}`
    );
    for (let i = 0; i < amountToPrompt; i++) {
        const user = usersCopy[Math.floor(Math.random() * usersCopy.length)];
        usersCopy = usersCopy.filter(
            (u: GuildMember | User) => u.id !== user.id
        );
        client.logger?.info(
            `Prompting ${getUserTag(user)} with prompt ${promptFormatted}`
        );
        await sendButtonWithPromptToUser(question, promptFormatted, user);
    }
}

export async function promptUsersForFibs(client: Bot) {
    const users = await getUsersWithFibbageRole(client);
    if (users.length <= 1) {
        return;
    }
    const questionsThatNeedFibs = await client.database.getQuestionsInState(
        FibbageQuestionState.ANSWERED
    );
    if (questionsThatNeedFibs.length === 0) {
        return;
    }
    for (const question of questionsThatNeedFibs) {
        const eligibleUsers = users.filter((user) => user.id !== question.user);
        await promptRandomUsersForFibs(client, question, eligibleUsers);
        question.state = FibbageQuestionState.PROMPTED;
        await question.save();
    }
}

export function generatePromptModal(questionId: number) {
    return new Modal()
        .setTitle('Fibbage')
        .addComponents(
            new MessageActionRow<ModalActionRowComponent>().addComponents(
                new TextInputComponent()
                    .setLabel('Enter your lie: ')
                    .setPlaceholder(
                        "Be creative! You'll get points if other players pick your lie!."
                    )
                    .setMaxLength(MAX_ALLOWED_CHARS_IN_BUTTON)
                    .setRequired(true)
                    .setStyle('SHORT')
                    .setCustomId('fibbage_prompt_input')
            )
        )
        .setCustomId(`fibbage_prompt_modal_${questionId}`);
}

export function groupIdenticalAnswers(
    answers: FibbageAnswer[]
): FibbageAnswer[][] {
    return answers.reduce((acc, curr) => {
        const answerGroup = acc.find((group: FibbageAnswer[]) =>
            group.some((a) => a.answer === curr.answer)
        );
        if (answerGroup) {
            answerGroup.push(curr);
        } else {
            acc.push([curr]);
        }
        return acc;
    }, [] as FibbageAnswer[][]);
}

async function generateComponentsRowsForQuestionToPost(
    question: FibbageQuestion,
    answerGroups: FibbageAnswer[][]
) {
    const components: MessageActionRow[] = [
        new MessageActionRow(),
        new MessageActionRow(),
        new MessageActionRow(),
        new MessageActionRow(),
    ];
    for (let i = 0; i < MAX_ANSWERS_ALLOWED; i++) {
        const componentsIndex = Math.floor(i / ANSWER_BUTTONS_PER_ROW);
        const answerGroup =
            answerGroups[Math.floor(Math.random() * answerGroups.length)];
        components[componentsIndex].addComponents(
            new MessageButton()
                .setLabel(answerGroup[0].answer)
                .setStyle('PRIMARY')
                .setCustomId(`fibbage_answer_button_${question.id}_${i}`)
        );
        for (const answer of answerGroup) {
            answer.answerPosition = i;
            await answer.save();
        }
        answerGroups = answerGroups.filter((a) => a !== answerGroup);
    }
    return components;
}

async function fillMissingAnswersForQuestion(
    client: Bot,
    question: FibbageQuestion,
    defaultAnswers: FibbageDefaultAnswers
) {
    const answerGroups = groupIdenticalAnswers(question.answers);
    let validDefaultAnswers = defaultAnswers.filter(
        (answer) =>
            !answerGroups.some((g) => g.some((a) => a.answer === answer))
    );
    const amountOfAnswersToAdd = MAX_ANSWERS_ALLOWED - answerGroups.length;
    client.logger?.debug(
        `Adding ${amountOfAnswersToAdd} answers to question ${question.id}`
    );
    for (let i = 0; i < amountOfAnswersToAdd; i++) {
        const answer =
            validDefaultAnswers[
                Math.floor(Math.random() * validDefaultAnswers.length)
            ];
        validDefaultAnswers = validDefaultAnswers.filter((a) => a !== answer);
        await client.database.insertFibbageAnswer(
            answer,
            client.user!.id,
            false,
            question
        );
    }
}

async function postNewQuestion(
    client: Bot,
    channel: TextBasedChannel,
    question: FibbageQuestion
) {
    const questionUser = await client.users.fetch(question.user);
    const prompt = getFibbagePrompts()[question.question];
    const promptFormatted = prompt.prompt.replace(/\{0}/g, questionUser.tag);
    let answerGroups = groupIdenticalAnswers(question.answers);
    if (answerGroups.length < MAX_ANSWERS_ALLOWED) {
        await fillMissingAnswersForQuestion(client, question, prompt.answers);
        answerGroups = groupIdenticalAnswers(await question.$get('answers'));
    }
    let componentRows = await generateComponentsRowsForQuestionToPost(
        question,
        answerGroups
    );
    client.logger?.info(`Posting new question ${question.id}`);
    return await channel.send({
        content: escapeDiscordMarkdown(promptFormatted),
        components: componentRows,
    });
}

export async function postNewQuestions(client: Bot) {
    const questions = await client.database.getQuestionsInState(
        FibbageQuestionState.PROMPTED,
        { loadAnswers: true }
    );
    if (questions.length === 0) {
        return;
    }
    const channel = await client.channels.fetch(getChannel());
    if (!channel || !channel.isText()) {
        return;
    }
    for (const question of questions) {
        const message = await postNewQuestion(client, channel, question);
        question.state = FibbageQuestionState.IN_USE;
        question.message = message.id;
        await question.save();
    }
}

function generateComponentsRowsForPostedQuestion(
    client: Bot,
    question: FibbageQuestion,
    answerGroups: FibbageAnswer[][]
) {
    const components: MessageActionRow[] = [
        new MessageActionRow(),
        new MessageActionRow(),
        new MessageActionRow(),
        new MessageActionRow(),
    ];
    for (let i = 0; i < MAX_ANSWERS_ALLOWED; i++) {
        const componentsIndex = Math.floor(i / ANSWER_BUTTONS_PER_ROW);
        const answerGroup = answerGroups.find((g) => g[0].answerPosition === i);
        if (answerGroup) {
            const answer = answerGroup[0];
            components[componentsIndex].addComponents(
                new MessageButton()
                    .setLabel(answer.answer)
                    .setStyle(answer.isCorrect ? 'SUCCESS' : 'DANGER')
                    .setCustomId(`fibbage_answer_button_${question.id}_${i}`)
            );
        } else {
            client.logger?.debug(
                `No answer found for question ${question.id} answer position ${i}`
            );
        }
    }
    return components;
}

function addToUserScore(
    scores: Map<Snowflake, FibbageScoreSummary>,
    user: Snowflake,
    answer: FibbageAnswer,
    amount: number
) {
    let score = scores.get(user);
    if (!score) {
        score = {
            answerId: answer.id,
            points: 0,
        };
    }
    scores.set(user, {
        answerId: answer.id,
        points: score.points + amount,
    });
}

async function awardPointsToUsers(
    answerGroups: FibbageAnswer[][],
    client: Bot
) {
    const scoresFromGuesses = new Map<Snowflake, FibbageScoreSummary>();
    const scoresFromAnswers = new Map<Snowflake, FibbageScoreSummary>();
    for (const answerGroup of answerGroups) {
        if (answerGroup[0].isCorrect) {
            for (const answer of answerGroup) {
                if (answer.guesses.length === 0) {
                    continue;
                }
                const authorStats = await client.database.getFibbageStats(
                    answer.user
                );
                for (const guess of answer.guesses) {
                    const guesserStats = await client.database.getFibbageStats(
                        guess.user
                    );
                    addToUserScore(
                        scoresFromGuesses,
                        guess.user,
                        answer,
                        POINTS_FOR_CORRECT_GUESS
                    );
                    client.logger?.debug(
                        `Awarded ${POINTS_FOR_CORRECT_GUESS} to ${guess.user} for correct guess.`
                    );
                    guesserStats.points += POINTS_FOR_CORRECT_GUESS;
                    guesserStats.timesAnsweredCorrectly++;
                    await guesserStats.save();
                    addToUserScore(
                        scoresFromAnswers,
                        answer.user,
                        answer,
                        POINTS_FOR_OTHER_CORRECT_GUESS
                    );
                    client.logger?.debug(
                        `Awarded ${POINTS_FOR_OTHER_CORRECT_GUESS} to ${answer.user} for someone's correct guess.`
                    );
                    authorStats.points += POINTS_FOR_OTHER_CORRECT_GUESS;
                    authorStats.timesOthersAnsweredCorrectly++;
                }
                await authorStats.save();
            }
        } else {
            for (const answer of answerGroup) {
                if (answer.guesses.length === 0) {
                    continue;
                }
                const authorStats = await client.database.getFibbageStats(
                    answer.user
                );
                for (const guess of answer.guesses) {
                    const guesserStats = await client.database.getFibbageStats(
                        guess.user
                    );
                    guesserStats.timesFooled++;
                    await guesserStats.save();
                    addToUserScore(
                        scoresFromAnswers,
                        answer.user,
                        answer,
                        POINTS_FOR_FOOLING_OTHERS
                    );
                    client.logger?.debug(
                        `Awarded ${POINTS_FOR_FOOLING_OTHERS} to ${answer.user} for fooling someone else.`
                    );
                    authorStats.points += POINTS_FOR_FOOLING_OTHERS;
                    authorStats.timesOthersFooled++;
                }
                await authorStats.save();
            }
        }
    }
    return { scoresFromGuesses, scoresFromAnswers };
}

function getUserMentionString(client: Bot, user: Snowflake) {
    return user !== client.user!.id ? `<@${user}>` : 'MY LIE >:3c';
}

function getPointsEarnedFromAnswer(
    answer: FibbageAnswer,
    scoresFromAnswers: Map<string, FibbageScoreSummary>
) {
    const pointsPerAnswerSubmitter = Array.from(
        scoresFromAnswers.entries()
    ).filter(([, summary]) => {
        return summary.answerId === answer.id;
    });
    const pointsEarned =
        pointsPerAnswerSubmitter.length !== 0
            ? pointsPerAnswerSubmitter[0][1].points
            : 0;
    return pointsEarned;
}

function getUserMentionsForAnswer(client: Bot, group: FibbageAnswer[]) {
    return group.reduce(
        (acc, answer) =>
            acc.length === 0
                ? `${getUserMentionString(client, answer.user)}`
                : ` AND ${getUserMentionString(client, answer.user)}`,
        ''
    );
}

function getPointRewardExplanationForAnswer(
    pointsEarned: number,
    answer: FibbageAnswer
) {
    if (pointsEarned === 0) {
        return '';
    } else if (answer.isCorrect) {
        const amountOfCorrectGuesses = Math.floor(
            pointsEarned / POINTS_FOR_OTHER_CORRECT_GUESS
        );
        return `(+${pointsEarned} points as a reputation bonus for ${amountOfCorrectGuesses} player(s) knowing them well!)`;
    } else {
        const amountOfPlayersFooled = Math.floor(
            pointsEarned / POINTS_FOR_FOOLING_OTHERS
        );
        return `(+${pointsEarned} points for fooling ${amountOfPlayersFooled} player(s))`;
    }
}

function getCreditStringForAnswer(
    client: Bot,
    group: FibbageAnswer[],
    pointsEarned: number
) {
    const answer = group[0];
    const answerType = answer.isCorrect ? 'TRUTH' : 'LIE';
    return `'${answer.answer}' (${answerType}): ${getUserMentionsForAnswer(
        client,
        group
    )} ${getPointRewardExplanationForAnswer(pointsEarned, answer)}\n`;
}

async function generateMessageForPostedQuestion(
    client: Bot,
    question: FibbageQuestion,
    answerGroups: FibbageAnswer[][]
) {
    const prompt = getFibbagePrompts()[question.question];
    const correctAnswer = answerGroups.find((g) => g[0].isCorrect);
    if (!correctAnswer) {
        client.logger?.error(
            `No correct answer found for question ${question.id}`
        );
        throw new Error(`No correct answer found for question ${question.id}`);
    }
    const promptFormatted = prompt.prompt
        .replace(/\{0}/g, `<@${question.user}>`)
        .replace(/_______/g, correctAnswer[0].answer);
    const { scoresFromGuesses, scoresFromAnswers } = await awardPointsToUsers(
        answerGroups,
        client
    );
    const guessString = Array.from(scoresFromGuesses.entries()).reduce(
        (acc, [user, summary]) => {
            return (
                acc +
                `<@${user}>: +${summary.points} points for guessing correctly.\n`
            );
        },
        ''
    );
    const answerCreditsStrings = answerGroups.reduce((acc, group) => {
        const answer = group[0];
        const pointsEarned = getPointsEarnedFromAnswer(
            answer,
            scoresFromAnswers
        );
        return acc + getCreditStringForAnswer(client, group, pointsEarned);
    }, '');
    const sep = '------';
    let message = `${promptFormatted}\n\n${sep}ANSWERS${sep}\n${answerCreditsStrings}`;
    if (guessString.length > 0) {
        message += `\n${sep}CORRECT GUESSES${sep}\n${guessString}`;
    }
    return message;
}

async function generateResultsForQuestion(
    client: Bot,
    question: FibbageQuestion
) {
    const answerGroups = groupIdenticalAnswers(question.answers);
    const components = generateComponentsRowsForPostedQuestion(
        client,
        question,
        answerGroups
    );
    const content = await generateMessageForPostedQuestion(
        client,
        question,
        answerGroups
    );
    return { components, content };
}

export async function showResultsForQuestions(client: Bot) {
    const questions = await client.database.getQuestionsInState(
        FibbageQuestionState.IN_USE,
        { loadAnswers: true, loadGuesses: true }
    );
    if (questions.length === 0) {
        return;
    }
    const channel = await client.channels.fetch(getChannel());
    if (!channel || !channel.isText()) {
        return;
    }
    for (const question of questions) {
        if (!question.message) {
            client.logger?.debug(
                `Question ${question.id} has no message, assuming intentional.`
            );
            continue;
        }
        const message = await channel.messages.fetch(question.message);
        if (!message) {
            client.logger?.debug(
                `Could not fetch message for question ${question.id}, assuming intentional.`
            );
            continue;
        }
        await message.edit(await generateResultsForQuestion(client, question));
        question.state = FibbageQuestionState.DONE;
        await question.save();
    }
}
