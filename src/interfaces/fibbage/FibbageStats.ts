import { Snowflake } from 'discord.js';
import { Model } from 'sequelize/types';

export interface FibbageStatsInstance extends Model {
    id: Snowflake;
    points: number;
    timesAnsweredCorrectly: number;
    timesFooled: number;
    timesOthersFooled: number;
    timesOthersAnsweredCorrectly: number;
}
