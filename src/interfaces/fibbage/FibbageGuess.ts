import { Snowflake } from 'discord.js';
import { Model } from 'sequelize/types';

export interface FibbageGuessInstance extends Model {
    id: number;
    user: Snowflake;
    answerId: number;
}
