import Conf from 'conf';
import {
    GuildMember,
    MessageActionRow,
    MessageButton,
    Modal,
    ModalActionRowComponent,
    TextInputComponent,
} from 'discord.js';
import Bot from '../client/Bot';
import {
    FibbagePrompt,
    FibbagePrompts,
} from '../interfaces/fibbage/FibbagePrompts';
import { FibbageQuestionInstance } from '../interfaces/fibbage/FibbageQuestion';

const MAX_ALLOWED_CHARS_IN_BUTTON = 80;

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

export function generateQuestionModal(question: string, questionId: number) {
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
            .setLabel('Click here to answer!')
            .setStyle('PRIMARY')
            .setCustomId(`fibbage_question_button_${questionId}`),
        new MessageButton()
            .setLabel('Click here to skip!')
            .setStyle('DANGER')
            .setCustomId(`fibbage_question_skip_${questionId}`)
    );
}

async function sendButtonPromptToUser(
    client: Bot,
    question: string,
    user: GuildMember
) {
    const dbQuestion = await client.database.insertFibbageQuestion(
        question,
        user.id
    );
    await user.send({
        content: `Hewwo! ^w^\nI'm here to ask you your question for fibbage!\n\n${question}`,
        components: [generateComponentsRowForQuestion(dbQuestion.id)],
    });
}

export async function giveUserNewQuestion(
    client: Bot,
    questions: string[],
    user: GuildMember
) {
    const question = questions[Math.floor(Math.random() * questions.length)];
    await sendButtonPromptToUser(client, question, user);
}

function getUnaskedQuestionsForUser(
    askedQuestions: FibbageQuestionInstance[],
    user: GuildMember
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

export async function promptUsersWithQuestions(client: Bot) {
    const users = await getUsersWithFibbageRole(client);
    if (users.length === 0) {
        return;
    }
    const askedQuestions = await client.database.getAllFibbageQuestions();
    const usersWithQuestion = askedQuestions.map((question) => {
        return question.user;
    });
    const usersWithoutQuestion = users.filter(
        (user) => !usersWithQuestion.includes(user.id)
    );
    if (usersWithoutQuestion.length === 0) {
        return;
    }
    for (const user of usersWithoutQuestion) {
        const promptList = getUnaskedQuestionsForUser(askedQuestions, user);
        await giveUserNewQuestion(client, promptList, user);
    }
}
