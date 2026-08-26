import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
    DataType,
    Default,
} from 'sequelize-typescript';

@Table({
    modelName: 'message_counts',
    timestamps: false,
})
export class MessageCount extends Model {
    @AllowNull(false)
    @PrimaryKey
    @Column
    id!: string;

    @Default(0)
    @Column(DataType.INTEGER)
    count!: number;
}
