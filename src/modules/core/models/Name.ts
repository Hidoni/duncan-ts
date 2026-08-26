import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
    DataType,
} from 'sequelize-typescript';

@Table({
    modelName: 'names',
    timestamps: false,
})
export class Name extends Model {
    @AllowNull(false)
    @PrimaryKey
    @Column
    id!: string;

    @AllowNull(true)
    @Column(DataType.STRING)
    name!: string | null;
}
