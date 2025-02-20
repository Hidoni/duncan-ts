import { Table, Column, Model, AllowNull, AutoIncrement, PrimaryKey, Unique } from 'sequelize-typescript';

@Table({
    modelName: 'interact_usage',
    timestamps: false
})
export class CommandUsage extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Unique('user_command')
    @Column
    user!: string;

    @AllowNull(false)
    @Column
    count!: number;
}

