import { Logger } from 'log4js';
import { ModelCtor, Sequelize } from 'sequelize';
import { QuestionInstance } from '../interfaces/question_of_the_day/Question';
import { initialize as initializeQuestions } from './models/Questions';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

export default class Database {
    private sequelize: Sequelize;
    private questions: ModelCtor<QuestionInstance>;

    public constructor(database: string, logger?: Logger) {
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: database,
            logging: logger?.debug.bind(logger),
        });

        this.questions = initializeQuestions(this.sequelize);
    }

    public sync(): void {
        this.sequelize.sync();
    }

    public async getUnusedQuestions(): Promise<QuestionInstance[]> {
        return this.questions.findAll({ where: { used: false } });
    }

    public async insertQuestion(
        question: string,
        authorName: string
    ): Promise<void> {
        this.questions.create({ question: question, authorName: authorName, addedAt: new Date() });
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
            return 1 / daysSinceCreated;
        });
        const totalWeight = weights.reduce((a, b) => a + b);
        const randomWeight = Math.random() * totalWeight;
        let currentWeight = 0;
        for (let i = 0; i < weights.length; i++) {
            currentWeight += weights[i];
            if (randomWeight < currentWeight) {
                return questions[i];
            }
        }

        return null;
    }
}
