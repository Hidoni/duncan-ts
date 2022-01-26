import { ModelCtor, Sequelize } from 'sequelize';
import { initialize as initializeQuestions } from '../database/models/Questions';
import { initialize as initializeGimmickPoints } from '../database/models/GimmickPoints';
import { QuestionInstance } from '../interfaces/question_of_the_day/Question';
import { GimmickPointsInstance } from '../interfaces/gimmicks/GimmickPoints';
import { setChannel, setDays } from '../utils/QuestionOfTheDayUtils';

const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;
const FIRST_QUESTION_TIMESTAMP = 1571917449908;

const QUESTIONS_JSON = require('../../questions.json');
const GIMMICK_POINTS_JSON = require('../../gimmickpoints.json');
setDays(QUESTIONS_JSON.days);
setChannel(QUESTIONS_JSON.channel);

if (process.env.DATABASE_PATH) {
    let sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: process.env.DATABASE_PATH,
    });
    let questions = initializeQuestions(sequelize);
    let gimmickPoints = initializeGimmickPoints(sequelize);

    importQuestions(questions);
    importGimmickPoints(gimmickPoints);
    sequelize.sync();
} else {
    console.error('DATABASE_PATH env var is not defined');
}

function importQuestions(questions: ModelCtor<QuestionInstance>) {
    for (const question in QUESTIONS_JSON['used']) {
        questions.create({
            question: QUESTIONS_JSON['used'][question]['question'],
            authorName: QUESTIONS_JSON['used'][question]['author'],
            addedAt: new Date(FIRST_QUESTION_TIMESTAMP),
            used: true,
        });
    }
    for (const question in QUESTIONS_JSON['unused']) {
        questions.create({
            question: QUESTIONS_JSON['unused'][question]['question'],
            authorName: QUESTIONS_JSON['unused'][question]['author'],
            addedAt: new Date(
                new Date().getTime() -
                    QUESTIONS_JSON['unused'][question]['days'] *
                        MILLISECONDS_IN_DAY
            ),
            used: false,
        });
    }
}

function importGimmickPoints(gimmickPoints: ModelCtor<GimmickPointsInstance>) {
    for (const gimmick in GIMMICK_POINTS_JSON) {
        gimmickPoints.create({
            id: gimmick,
            points: GIMMICK_POINTS_JSON[gimmick],
        });
    }
}
