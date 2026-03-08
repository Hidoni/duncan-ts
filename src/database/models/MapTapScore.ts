import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
} from 'sequelize-typescript';

@Table({
    modelName: 'maptap_scores',
    timestamps: false,
})
export class MapTapScore extends Model {
    @AllowNull(false)
    @PrimaryKey
    @Column
    user!: string;

    @AllowNull(false)
    @PrimaryKey
    @Column
    date!: Date;

    @AllowNull(false)
    @Column
    firstRound!: number;

    @AllowNull(false)
    @Column
    secondRound!: number;

    @AllowNull(false)
    @Column
    thirdRound!: number;

    @AllowNull(false)
    @Column
    fourthRound!: number;

    @AllowNull(false)
    @Column
    fifthRound!: number;

    public getFinalScore(): number {
        return (
            this.firstRound +
            this.secondRound +
            this.thirdRound +
            this.fourthRound +
            this.fifthRound
        );
    }
}
