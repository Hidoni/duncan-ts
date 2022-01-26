import { Logger } from 'log4js';
import { ModelCtor, Sequelize } from 'sequelize';
import { QuestionInstance } from '../interfaces/question_of_the_day/Question';
import { GimmickPointsInstance } from '../interfaces/gimmicks/GimmickPoints';
import { initialize as initializeQuestions } from './models/Questions';
import { initialize as initializeGimmickPoints } from './models/GimmickPoints';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export default class Database {
    private sequelize: Sequelize;
    private questions: ModelCtor<QuestionInstance>;
    private gimmickPoints: ModelCtor<GimmickPointsInstance>;

    public constructor(database: string, logger?: Logger) {
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: database,
            logging: logger?.debug.bind(logger),
        });

        this.questions = initializeQuestions(this.sequelize);
        this.gimmickPoints = initializeGimmickPoints(this.sequelize);
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
        return await this.gimmickPoints.findAll();
    }
}
