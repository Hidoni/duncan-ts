import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
    Default,
} from 'sequelize-typescript';

@Table({
    modelName: 'gimmicks_points',
    timestamps: false,
})
export class GimmickPoints extends Model {
    @AllowNull(false)
    @PrimaryKey
    @Column
    id!: string;

    @AllowNull(false)
    @Default(0)
    @Column
    points!: number;
}
