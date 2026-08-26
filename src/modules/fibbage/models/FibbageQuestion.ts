import {
    Table,
    Column,
    Model,
    AllowNull,
    AutoIncrement,
    PrimaryKey,
    Default,
    DataType,
    HasMany,
} from 'sequelize-typescript';
import { FibbageAnswer } from './FibbageAnswer';

export enum FibbageQuestionState {
    ASKED = 'ASKED',
    ANSWERED = 'ANSWERED',
    PROMPTED = 'PROMPTED',
    IN_USE = 'IN_USE',
    DONE = 'DONE',
    SKIPPED = 'SKIPPED',
}

@Table({
    modelName: 'fibbage_questions',
    timestamps: false,
    indexes: [
        {
            fields: ['user'],
        },
    ],
})
export class FibbageQuestion extends Model {
    @AllowNull(false)
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    question!: string;

    @AllowNull(false)
    @Column
    user!: string;

    @AllowNull(false)
    @Default(FibbageQuestionState.ASKED)
    @Column(DataType.ENUM(...Object.keys(FibbageQuestionState)))
    state!: FibbageQuestionState;

    @AllowNull(true)
    @Column(DataType.STRING)
    message!: string | null;

    @HasMany(() => FibbageAnswer, 'questionId')
    answers!: FibbageAnswer[];
}
