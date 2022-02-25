import {
    Table,
    Column,
    Model,
    AllowNull,
    AutoIncrement,
    PrimaryKey,
    Unique,
    Default,
    DataType,
} from 'sequelize-typescript';

@Table({
    modelName: 'qotd_questions',
    timestamps: false,
    indexes: [
        {
            fields: ['question'],
        },
    ],
})
export class Question extends Model {
    @AllowNull(false)
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Unique(true)
    @Column
    question!: string;

    @AllowNull(false)
    @Column
    addedAt!: Date;

    @AllowNull(true)
    @Column(DataType.TEXT)
    authorName!: string | null;

    @AllowNull(false)
    @Default(false)
    @Column
    used!: boolean;
}
