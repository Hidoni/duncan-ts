import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
    Default,
} from 'sequelize-typescript';

@Table({
    modelName: 'fibbage_stats',
    timestamps: false,
})
export class FibbageStats extends Model {
    @AllowNull(false)
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Default(0)
    @Column
    points!: number;

    @AllowNull(false)
    @Default(0)
    @Column
    timesAnsweredCorrectly!: number;

    @AllowNull(false)
    @Default(0)
    @Column
    timesFooled!: number;

    @AllowNull(false)
    @Default(0)
    @Column
    timesOthersFooled!: number;

    @AllowNull(false)
    @Default(0)
    @Column
    timesOthersAnsweredCorrectly!: number;
}
