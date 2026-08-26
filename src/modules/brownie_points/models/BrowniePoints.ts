import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
    Default,
} from 'sequelize-typescript';

@Table({
    modelName: 'brownie_points',
    timestamps: false,
})
export class BrowniePoints extends Model {
    @AllowNull(false)
    @PrimaryKey
    @Column
    id!: string;

    @AllowNull(false)
    @Default(0)
    @Column
    points!: number;
}
