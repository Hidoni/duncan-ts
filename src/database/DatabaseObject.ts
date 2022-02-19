import { Logger } from 'log4js';
import { ModelCtor, Sequelize } from 'sequelize';
import { QuestionInstance } from '../interfaces/question_of_the_day/Question';
import { GimmickPointsInstance } from '../interfaces/gimmicks/GimmickPoints';
import {
    FibbageQuestionInstance,
    FibbageQuestionState,
} from '../interfaces/fibbage/FibbageQuestion';
import { FibbageAnswerInstance } from '../interfaces/fibbage/FibbageAnswer';
import { FibbageGuessInstance } from '../interfaces/fibbage/FibbageGuess';
import { FibbageStatsInstance } from '../interfaces/fibbage/FibbageStats';
import { initialize as initializeQuestions } from './models/Questions';
import { initialize as initializeGimmickPoints } from './models/GimmickPoints';
import { initialize as initializeFibbageQuestions } from './models/FibbageQuestions';
import { initialize as initializeFibbageAnswers } from './models/FibbageAnswers';
import { initialize as initializeFibbageGuesses } from './models/FibbageGuesses';
import { initialize as initializeFibbageStats } from './models/FibbageStats';
import { Snowflake } from 'discord.js';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export default class Database {
    private sequelize: Sequelize;
    private questions: ModelCtor<QuestionInstance>;
    private gimmickPoints: ModelCtor<GimmickPointsInstance>;
    private fibbageQuestions: ModelCtor<FibbageQuestionInstance>;
    private fibbageAnswers: ModelCtor<FibbageAnswerInstance>;
    private fibbageGuesses: ModelCtor<FibbageGuessInstance>;
    private fibbageStats: ModelCtor<FibbageStatsInstance>;

    public constructor(database: string, logger?: Logger) {
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: database,
            logging: logger?.debug.bind(logger),
        });

        this.questions = initializeQuestions(this.sequelize);
        this.gimmickPoints = initializeGimmickPoints(this.sequelize);
        this.fibbageQuestions = initializeFibbageQuestions(this.sequelize);
        this.fibbageAnswers = initializeFibbageAnswers(this.sequelize);
        this.fibbageQuestions.hasMany(this.fibbageAnswers, {sourceKey: 'id', foreignKey: 'questionId', as: 'Answer'});
        this.fibbageAnswers.belongsTo(this.fibbageQuestions, {targetKey: 'id', foreignKey: 'questionId', as: 'Question'});
        this.fibbageGuesses = initializeFibbageGuesses(this.sequelize);
        this.fibbageAnswers.hasMany(this.fibbageGuesses, {sourceKey: 'id', foreignKey: 'answerId', as: {singular: 'Guess', plural: 'Guesses'}});
        this.fibbageGuesses.belongsTo(this.fibbageAnswers, {targetKey: 'id', foreignKey: 'answerId', as: 'Answer'});
        this.fibbageStats = initializeFibbageStats(this.sequelize);
    }

    public sync(): void {
        this.sequelize.sync();
    }

    public async getUnusedQuestions(): Promise<QuestionInstance[]> {
        return await this.questions.findAll({ where: { used: false } });
    }

    public async insertQuestion(
        question: string,
        authorName: string
    ): Promise<void> {
        await this.questions.create({
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

    public async getGimmickPoints(id: string): Promise<GimmickPointsInstance> {
        const points = await this.gimmickPoints.findOne({ where: { id: id } });
        if (!points) {
            return this.gimmickPoints.create({ id: id });
        }
        return points;
    }

    public async getAllGimmickPoints(): Promise<GimmickPointsInstance[]> {
        return await this.gimmickPoints.findAll({
            order: Sequelize.literal('points DESC'),
        });
    }

    public async getFibbageStats(id: Snowflake): Promise<FibbageStatsInstance> {
        const stats = await this.fibbageStats.findOne({ where: { id: id } });
        if (!stats) {
            return this.fibbageStats.create({ id: id });
        }
        return stats;
    }

    public async getAllFibbageStats(): Promise<FibbageStatsInstance[]> {
        return await this.fibbageStats.findAll({
            order: Sequelize.literal('points DESC'),
        });
    }

    public async getFibbageQuestion(
        id: number
    ): Promise<FibbageQuestionInstance | null> {
        const question = await this.fibbageQuestions.findOne({
            where: { id: id },
        });
        if (!question) {
            return null;
        }
        return question;
    }

    public async getFibbageAnswer(
        id: number
    ): Promise<FibbageAnswerInstance | null> {
        const answer = await this.fibbageAnswers.findOne({
            where: { id: id },
        });
        if (!answer) {
            return null;
        }
        return answer;
    }

    public async getFibbageAnswersForQuestion(
        questionId: number
    ): Promise<FibbageAnswerInstance[]> {
        return await this.fibbageAnswers.findAll({
            where: { questionId: questionId },
        });
    }

    public async insertFibbageQuestion(
        question: string,
        user: Snowflake
    ): Promise<FibbageQuestionInstance> {
        return await this.fibbageQuestions.create({
            question: question,
            user: user,
        });
    }

    public async insertFibbageAnswer(
        answer: string,
        user: Snowflake,
        questionId: number
    ): Promise<void> {
        await this.fibbageAnswers.create({
            answer: answer,
            user: user,
            questionId: questionId,
        });
    }

    public async getAnsweredFibbageQuestions(): Promise<
        FibbageQuestionInstance[]
    > {
        return await this.fibbageQuestions.findAll({
            where: { state: FibbageQuestionState.ANSWERED },
        });
    }

    public async getQuestionsReadyToPost(): Promise<FibbageQuestionInstance[]> {
        return await this.fibbageQuestions.findAll({
            where: { state: FibbageQuestionState.ANSWERED },
        });
    }
}
