import { Module } from '../../interfaces/Module';
import * as QuestionOfTheDayCommand from './commands/QuestionOfTheDayCommand';
import * as QuestionOfTheDayJob from './jobs/QuestionOfTheDayJob';
import { Question } from './models/Question';

const questionOfTheDayModule: Module = {
    name: 'question_of_the_day',
    commands: [QuestionOfTheDayCommand],
    jobs: [QuestionOfTheDayJob],
    models: [Question],
};

export default questionOfTheDayModule;
