import { Snowflake } from 'discord.js';
import { Model } from 'sequelize/types';

export interface FibbageAnswerInstance extends Model {
    id: number;
    answer: string;
    user: Snowflake;
    isCorrect: boolean;
    questionId: number;
}
