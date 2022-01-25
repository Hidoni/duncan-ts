import { ModelCtor, Sequelize } from 'sequelize';
import { initialize as initializeQuestions } from '../database/models/Questions';
import { QuestionInstance } from '../interfaces/question_of_the_day/Question';
import { setChannel, setDays } from '../utils/QuestionOfTheDayUtils';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const FIRST_QUESTION_TIMESTAMP = 1571917449908;

const questionsJSON = require('../../questions.json');
setDays(questionsJSON.days);
setChannel(questionsJSON.channel);

if (process.env.DATABASE_PATH) {
    let sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DATABASE_PATH,
    });
    let questions = initializeQuestions(sequelize);

    importQuestions(questions);
    sequelize.sync();
} else {
    console.error('DATABASE_PATH env var is not defined');
}

function importQuestions(questions: ModelCtor<QuestionInstance>) {
    for (const question in questionsJSON['used']) {
        questions.create({
            question: questionsJSON['used'][question]['question'],
            authorName: questionsJSON['used'][question]['author'],
            addedAt: new Date(FIRST_QUESTION_TIMESTAMP),
            used: true,
        });
    }
    for (const question in questionsJSON['unused']) {
        questions.create({
            question: questionsJSON['unused'][question]['question'],
            authorName: questionsJSON['unused'][question]['author'],
            addedAt: new Date(
                new Date().getTime() -
                questionsJSON['unused'][question]['days'] *
                MILLISECONDS_IN_DAY
            ),
            used: false,
        });
    }
}

