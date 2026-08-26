import { Snowflake } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import { Includeable } from 'sequelize/types';
import { FibbageEagerLoadingOptions } from './interfaces/FibbageEagerLoadingOptions';
import { FibbageAnswer } from './models/FibbageAnswer';
import { FibbageCustomPrompt } from './models/FibbageCustomPrompt';
import { FibbageCustomPromptApproval } from './models/FibbageCustomPromptApproval';
import { FibbageCustomPromptDefaultAnswer } from './models/FibbageCustomPromptDefaultAnswer';
import { FibbageGuess } from './models/FibbageGuess';
import {
    FibbageQuestion,
    FibbageQuestionState,
} from './models/FibbageQuestion';
import { FibbageStats, FibbageStatsColumns } from './models/FibbageStats';

function generateGuessInclude(
    eagerLoadingOptions: FibbageEagerLoadingOptions
): Includeable[] {
    return eagerLoadingOptions.loadGuesses ? [{ model: FibbageGuess }] : [];
}

function generateAnswerInclude(
    eagerLoadingOptions: FibbageEagerLoadingOptions
): Includeable[] {
    return eagerLoadingOptions.loadAnswers
        ? [
              {
                  model: FibbageAnswer,
                  include: generateGuessInclude(eagerLoadingOptions),
              },
          ]
        : [];
}

function generateQuestionInclude(
    eagerLoadingOptions: FibbageEagerLoadingOptions
): Includeable[] {
    return eagerLoadingOptions.loadQuestion
        ? [
              {
                  model: FibbageQuestion,
                  include: generateAnswerInclude(eagerLoadingOptions),
              },
          ]
        : [];
}

export async function getFibbageStats(id: Snowflake): Promise<FibbageStats> {
    const stats = await FibbageStats.findOne({ where: { id: id } });
    if (!stats) {
        return FibbageStats.create({ id: id });
    }
    return stats;
}

export async function getAllFibbageStats(): Promise<FibbageStats[]> {
    return await FibbageStats.findAll({
        order: Sequelize.literal('points DESC'),
    });
}

export async function getFibbageStatsByColumn(
    column: keyof FibbageStatsColumns
): Promise<FibbageStats[]> {
    return await FibbageStats.findAll({
        order: Sequelize.literal(`${column} DESC`),
    });
}

export async function getFibbageQuestion(
    id: number,
    eagerLoadingOptions: FibbageEagerLoadingOptions = {}
): Promise<FibbageQuestion | null> {
    return await FibbageQuestion.findOne({
        where: { id: id },
        include: generateAnswerInclude(eagerLoadingOptions),
    });
}

export async function getFibbageAnswer(
    id: number,
    eagerLoadingOptions: FibbageEagerLoadingOptions = {}
): Promise<FibbageAnswer | null> {
    return await FibbageAnswer.findOne({
        where: { id: id },
        include: generateQuestionInclude(eagerLoadingOptions).concat(
            generateGuessInclude(eagerLoadingOptions)
        ),
    });
}

export async function getFibbageAnswersForQuestion(
    questionId: number,
    eagerLoadingOptions: FibbageEagerLoadingOptions = {}
): Promise<FibbageAnswer[]> {
    return FibbageQuestion.findByPk(questionId, {
        include: generateAnswerInclude({
            loadAnswers: true,
            loadGuesses: eagerLoadingOptions.loadGuesses,
        }),
    }).then((question) => {
        if (!question) {
            return [];
        } else {
            return question.answers;
        }
    });
}

export async function insertFibbageQuestion(
    question: string,
    user: Snowflake
): Promise<FibbageQuestion> {
    return await FibbageQuestion.create({
        question: question,
        user: user,
    });
}

export async function insertFibbageAnswerByQuestionId(
    answer: string,
    user: Snowflake,
    isCorrect: boolean,
    questionId: number
): Promise<void> {
    await getFibbageQuestion(questionId).then(async (question) => {
        if (!question) {
            throw new Error('Question not found');
        }
        await insertFibbageAnswer(answer, user, isCorrect, question);
    });
}

export async function insertFibbageAnswer(
    answer: string,
    user: Snowflake,
    isCorrect: boolean,
    question: FibbageQuestion
): Promise<void> {
    await question.$add(
        'answer',
        await FibbageAnswer.create({
            answer: answer,
            user: user,
            isCorrect: isCorrect,
        })
    );
}

export async function getQuestionsInState(
    state: FibbageQuestionState,
    eagerLoadingOptions: FibbageEagerLoadingOptions = {}
): Promise<FibbageQuestion[]> {
    return await FibbageQuestion.findAll({
        where: { state: state },
        include: generateAnswerInclude(eagerLoadingOptions),
    });
}

export async function getAllFibbageQuestions(
    eagerLoadingOptions: FibbageEagerLoadingOptions = {}
): Promise<FibbageQuestion[]> {
    return await FibbageQuestion.findAll({
        include: generateAnswerInclude(eagerLoadingOptions),
    });
}

export async function insertFibbageGuess(
    user: Snowflake,
    answer: FibbageAnswer
): Promise<void> {
    await answer.$add('guess', await FibbageGuess.create({ user: user }));
}

export async function getAllCustomFibbagePrompts(): Promise<
    FibbageCustomPrompt[]
> {
    return await FibbageCustomPrompt.findAll({
        include: [
            { model: FibbageCustomPromptDefaultAnswer },
            { model: FibbageCustomPromptApproval },
        ],
        group: ['fibbage_custom_prompts.id'],
        having: Sequelize.literal(
            'COUNT(fibbage_custom_prompt_approvals.id) > 2'
        ),
    });
}
