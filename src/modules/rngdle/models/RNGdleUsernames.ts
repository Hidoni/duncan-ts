import {
    Table,
    Column,
    Model,
    AllowNull,
    PrimaryKey,
} from 'sequelize-typescript';

@Table({
    modelName: 'rngdle_usernames',
    timestamps: false,
})
export class RNGdleUsername extends Model {
    @AllowNull(false)
    @PrimaryKey
    @Column
    user!: string;

    @AllowNull(false)
    @Column
    rngdleUsername!: string;
}
