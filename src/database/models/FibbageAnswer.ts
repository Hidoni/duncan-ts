import {
    Table,
    Column,
    Model,
    AllowNull,
    AutoIncrement,
    PrimaryKey,
    BelongsTo,
    HasMany,
    DataType,
} from 'sequelize-typescript';
import { FibbageGuess } from './FibbageGuess';
import { FibbageQuestion } from './FibbageQuestion';

@Table({
    modelName: 'fibbage_answers',
    timestamps: false,
    indexes: [
        {
            fields: ['answer'],
        },
    ],
})
export class FibbageAnswer extends Model {
    @AllowNull(false)
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    answer!: string;

    @AllowNull(false)
    user!: string;

    @AllowNull(false)
    @Column
    isCorrect!: boolean;

    @AllowNull(true)
    @Column(DataType.INTEGER)
    answerPosition!: number | null;

    @BelongsTo(() => FibbageQuestion, 'questionId')
    question!: FibbageQuestion;

    @HasMany(() => FibbageGuess, 'answerId')
    guesses!: FibbageGuess[];
}
