import { Snowflake } from 'discord.js';
import { Model } from 'sequelize/types';

export enum FibbageQuestionState {
    ASKED = 'ASKED',
    ANSWERED = 'ANSWERED',
    PROMPTED = 'PROMPTED',
    IN_USE = 'IN_USE',
    DONE = 'DONE',
    SKIPPED = 'SKIPPED',
}

export interface FibbageQuestionInstance extends Model {
    id: number;
    question: string;
    user: Snowflake;
    state: FibbageQuestionState;
    message: Snowflake;
}
