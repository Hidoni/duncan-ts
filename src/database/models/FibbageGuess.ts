import {
    Table,
    Column,
    Model,
    AllowNull,
    AutoIncrement,
    PrimaryKey,
    BelongsTo,
} from 'sequelize-typescript';
import { FibbageAnswer } from './FibbageAnswer';

@Table({
    modelName: 'fibbage_guesses',
    timestamps: false,
    indexes: [
        {
            fields: ['user'],
        },
    ],
})
export class FibbageGuess extends Model {
    @AllowNull(false)
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    user!: string;

    @AllowNull(false)
    @Column
    answerId!: number;

    @BelongsTo(() => FibbageAnswer, 'answerId')
    answer!: FibbageAnswer;
}
