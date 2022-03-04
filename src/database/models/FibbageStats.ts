import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
    Default,
} from 'sequelize-typescript';

export interface FibbageStatsColumns {
    id: number;
    points: number;
    timesAnsweredCorrectly: number;
    timesFooled: number;
    timesOthersFooled: number;
    timesOthersAnsweredCorrectly: number;
    questionsSubmitted: number;
    liesSubmitted: number;
    timesGuessed: number;
}

@Table({
    modelName: 'fibbage_stats',
    timestamps: false,
})
export class FibbageStats
    extends Model<FibbageStatsColumns>
    implements FibbageStatsColumns
{
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

    @AllowNull(false)
    @Default(0)
    @Column
    questionsSubmitted!: number;

    @AllowNull(false)
    @Default(0)
    @Column
    liesSubmitted!: number;

    @AllowNull(false)
    @Default(0)
    @Column
    timesGuessed!: number;
}
