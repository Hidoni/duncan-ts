import {
    Table,
    Column,
    Model,
    AllowNull,
    AutoIncrement,
    PrimaryKey,
} from 'sequelize-typescript';

@Table({
    modelName: 'fibbage_custom_prompts',
    timestamps: false,
    indexes: [
        {
            fields: ['prompt'],
        },
    ],
})
export class FibbageCustomPrompt extends Model {
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
    prompt!: string;

    @AllowNull(false)
    @Column
    answerOne!: string;

    @AllowNull(false)
    @Column
    answerTwo!: string;

    @AllowNull(false)
    @Column
    answerThree!: string;

    @AllowNull(false)
    @Column
    answerFour!: string;

    @AllowNull(false)
    @Column
    answerFive!: string;

    @AllowNull(false)
    @Column
    answerSix!: string;

    @AllowNull(false)
    @Column
    answerSeven!: string;

    @AllowNull(false)
    @Column
    user!: string;
}
