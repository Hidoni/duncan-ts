import { Logger } from 'log4js';

import { Snowflake } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import { Question } from './models/Question';
import { GimmickPoints } from './models/GimmickPoints';
import { FibbageStats, FibbageStatsColumns } from './models/FibbageStats';
import {
    FibbageQuestion,
    FibbageQuestionState,
} from './models/FibbageQuestion';
import { FibbageAnswer } from './models/FibbageAnswer';
import { FibbageGuess } from './models/FibbageGuess';
import { FibbageEagerLoadingOptions } from '../interfaces/fibbage/FibbageEagerLoadingOptions';
import { FindOrCreateOptions, Includeable } from 'sequelize/types';
import { FibbageCustomPrompt } from './models/FibbageCustomPrompt';
import { FibbageCustomPromptDefaultAnswer } from './models/FibbageCustomPromptDefaultAnswer';
import { FibbageCustomPromptApproval } from './models/FibbageCustomPromptApproval';
import { Name } from './models/Name';
import { MessageCount } from './models/MessageCount';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export default class Database {
    private sequelize: Sequelize;

    public constructor(database: string, logger?: Logger) {
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: database,
            logging: logger?.log.bind(logger, 'sql'),
            models: [__dirname + '/models'],
        });
        this.sync();
    }

    public sync(): void {
        this.sequelize.sync();
    }

    public async getUnusedQuestions(): Promise<Question[]> {
        return await Question.findAll({ where: { used: false } });
    }

    public async insertQuestion(
        question: string,
        authorName: string
    ): Promise<void> {
        await Question.create({
            question: question,
            authorName: authorName,
            addedAt: new Date(),
        });
    }

    public async getRandomQuestion() {
        const questions = await this.getUnusedQuestions();
        if (questions.length === 0) {
            return null;
        }

        const now = Date.now();
        const weights = questions.map((question) => {
            const daysSinceCreated =
                1 +
                Math.floor(
                    (now - question.addedAt.getTime()) / MILLISECONDS_IN_DAY
                );
            return daysSinceCreated;
        });
        const totalWeight = weights.reduce((a, b) => a + b);
        let randomWeight = Math.random() * totalWeight;
        for (let i = 0; i < weights.length; i++) {
            if (randomWeight < weights[i]) {
                return questions[i];
            }
            randomWeight -= weights[i];
        }

        return null;
    }

    public async getGimmickPoints(id: string): Promise<GimmickPoints> {
        const points = await GimmickPoints.findOne({ where: { id: id } });
        if (!points) {
            return GimmickPoints.create({ id: id });
        }
        return points;
    }

    public async getAllGimmickPoints(): Promise<GimmickPoints[]> {
        return await GimmickPoints.findAll({
            order: Sequelize.literal('points DESC'),
        });
    }

    public async getFibbageStats(id: Snowflake): Promise<FibbageStats> {
        const stats = await FibbageStats.findOne({ where: { id: id } });
        if (!stats) {
            return FibbageStats.create({ id: id });
        }
        return stats;
    }

    public async getAllFibbageStats(): Promise<FibbageStats[]> {
        return await FibbageStats.findAll({
            order: Sequelize.literal('points DESC'),
        });
    }

    private generateGuessInclude(
        eagerLoadingOptions: FibbageEagerLoadingOptions
    ): Includeable[] {
        return eagerLoadingOptions.loadGuesses ? [{ model: FibbageGuess }] : [];
    }

    private generateAnswerInclude(
        eagerLoadingOptions: FibbageEagerLoadingOptions
    ): Includeable[] {
        return eagerLoadingOptions.loadAnswers
            ? [
                  {
                      model: FibbageAnswer,
                      include: this.generateGuessInclude(eagerLoadingOptions),
                  },
              ]
            : [];
    }

    private generateQuestionInclude(
        eagerLoadingOptions: FibbageEagerLoadingOptions
    ): Includeable[] {
        return eagerLoadingOptions.loadQuestion
            ? [
                  {
                      model: FibbageQuestion,
                      include: this.generateAnswerInclude(eagerLoadingOptions),
                  },
              ]
            : [];
    }

    public async getFibbageQuestion(
        id: number,
        eagerLoadingOptions: FibbageEagerLoadingOptions = {}
    ): Promise<FibbageQuestion | null> {
        return await FibbageQuestion.findOne({
            where: { id: id },
            include: this.generateAnswerInclude(eagerLoadingOptions),
        });
    }

    public async getFibbageAnswer(
        id: number,
        eagerLoadingOptions: FibbageEagerLoadingOptions = {}
    ): Promise<FibbageAnswer | null> {
        return await FibbageAnswer.findOne({
            where: { id: id },
            include: this.generateQuestionInclude(eagerLoadingOptions).concat(
                this.generateGuessInclude(eagerLoadingOptions)
            ),
        });
    }

    public async getFibbageAnswersForQuestion(
        questionId: number,
        eagerLoadingOptions: FibbageEagerLoadingOptions = {}
    ): Promise<FibbageAnswer[]> {
        return FibbageQuestion.findByPk(questionId, {
            include: this.generateAnswerInclude({
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

    public async insertFibbageQuestion(
        question: string,
        user: Snowflake
    ): Promise<FibbageQuestion> {
        return await FibbageQuestion.create({
            question: question,
            user: user,
        });
    }

    public async insertFibbageAnswerByQuestionId(
        answer: string,
        user: Snowflake,
        isCorrect: boolean,
        questionId: number
    ): Promise<void> {
        await this.getFibbageQuestion(questionId).then(async (question) => {
            if (!question) {
                throw new Error('Question not found');
            }
            await this.insertFibbageAnswer(answer, user, isCorrect, question);
        });
    }

    public async insertFibbageAnswer(
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

    public async getQuestionsInState(
        state: FibbageQuestionState,
        eagerLoadingOptions: FibbageEagerLoadingOptions = {}
    ): Promise<FibbageQuestion[]> {
        return await FibbageQuestion.findAll({
            where: { state: state },
            include: this.generateAnswerInclude(eagerLoadingOptions),
        });
    }

    public async getAllFibbageQuestions(
        eagerLoadingOptions: FibbageEagerLoadingOptions = {}
    ): Promise<FibbageQuestion[]> {
        return await FibbageQuestion.findAll({
            include: this.generateAnswerInclude(eagerLoadingOptions),
        });
    }

    public async insertFibbageGuess(
        user: Snowflake,
        answer: FibbageAnswer
    ): Promise<void> {
        await answer.$add('guess', await FibbageGuess.create({ user: user }));
    }

    public async getFibbageStatsByColumn(
        column: keyof FibbageStatsColumns
    ): Promise<FibbageStats[]> {
        return await FibbageStats.findAll({
            order: Sequelize.literal(`${column} DESC`),
        });
    }

    public async getAllCustomFibbagePrompts(): Promise<FibbageCustomPrompt[]> {
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

    public async insertOrUpdateName(
        user: Snowflake,
        name: string
    ): Promise<void> {
        await Name.findOrCreate({
            where: {
                id: user,
            },
        }).then(async ({ 0: instance }) => {
            instance.name = name;
            await instance.save();
        });
    }

    public async clearName(user: Snowflake): Promise<void> {
        const instance = await Name.findOne({ where: { id: user } });
        if (instance) {
            instance.name = null;
            await instance.save();
        }
    }

    public async getName(user: Snowflake): Promise<string | null> {
        const instance = await Name.findOne({ where: { id: user } });
        if (instance) {
            return instance.name;
        }
        return null;
    }

    public async incrementMessageCount(user: Snowflake): Promise<void> {
        await MessageCount.findOrCreate({ where: { id: user } }).then(
            async ({ 0: instance }) => {
                instance.count += 1;
                await instance.save();
            }
        );
    }

    public async clearAllMessageCounts(): Promise<void> {
        await MessageCount.update({ count: 0 }, { where: {} });
    }

    public async getMessageCount(user: Snowflake): Promise<number> {
        const instance = await MessageCount.findOne({ where: { id: user } });
        if (instance) {
            return instance.count;
        }
        return 0;
    }
}
