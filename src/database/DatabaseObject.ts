import { Logger } from 'log4js';

import { Snowflake } from 'discord.js';
import { Sequelize } from 'sequelize-typescript';
import { Question } from './models/Question';
import { GimmickPoints } from './models/GimmickPoints';
import { FibbageStats } from './models/FibbageStats';
import {
    FibbageQuestion,
    FibbageQuestionState,
} from './models/FibbageQuestion';
import { FibbageAnswer } from './models/FibbageAnswer';
import { FibbageGuess } from './models/FibbageGuess';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export default class Database {
    private sequelize: Sequelize;

    public constructor(database: string, logger?: Logger) {
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: database,
            logging: logger?.debug.bind(logger),
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

    private generateGuessInclude(loadGuesses: boolean) {
        return loadGuesses ? [{ model: FibbageGuess }] : [];
    }

    private generateAnswerInclude(loadAnswers: boolean, loadGuesses: boolean) {
        return loadAnswers
            ? [
                  {
                      model: FibbageAnswer,
                      include: this.generateGuessInclude(loadGuesses),
                  },
              ]
            : [];
    }

    public async getFibbageQuestion(
        id: number,
        loadAnswers: boolean = false,
        loadGuesses: boolean = false
    ): Promise<FibbageQuestion | null> {
        return await FibbageQuestion.findOne({
            where: { id: id },
            include: this.generateAnswerInclude(loadAnswers, loadGuesses),
        });
    }

    public async getFibbageAnswer(
        id: number,
        loadGuesses: boolean = false
    ): Promise<FibbageAnswer | null> {
        const includeGuesses = loadGuesses ? [{ model: FibbageGuess }] : [];
        return await FibbageAnswer.findOne({
            where: { id: id },
            include: this.generateGuessInclude(loadGuesses),
        });
    }

    public async getFibbageAnswersForQuestion(
        questionId: number,
        loadGuesses: boolean = false
    ): Promise<FibbageAnswer[]> {
        const includeGuesses = loadGuesses ? [{ model: FibbageGuess }] : [];
        return FibbageQuestion.findByPk(questionId, {
            include: this.generateAnswerInclude(true, loadGuesses),
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
        user: Snowflake | null,
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
        user: Snowflake | null,
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
        loadAnswers: boolean = false,
        loadGuesses: boolean = false
    ): Promise<FibbageQuestion[]> {
        return await FibbageQuestion.findAll({
            where: { state: state },
            include: this.generateAnswerInclude(loadAnswers, loadGuesses),
        });
    }

    public async getAllFibbageQuestions(
        loadAnswers: boolean = false,
        loadGuesses: boolean = false
    ): Promise<FibbageQuestion[]> {
        return await FibbageQuestion.findAll({
            include: this.generateAnswerInclude(loadAnswers, loadGuesses),
        });
    }
}
