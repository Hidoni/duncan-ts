import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
} from 'sequelize-typescript';

@Table({
    modelName: 'rngdle_rolls',
    timestamps: false,
})
export class RNGdleRoll extends Model {
    @AllowNull(false)
    @PrimaryKey
    @Column
    user!: string;

    @AllowNull(false)
    @PrimaryKey
    @Column
    id!: string;

    @Column
    date!: Date;

    @AllowNull(false)
    @Column
    number!: number;

    @AllowNull(false)
    @Column
    ep!: number;
}
