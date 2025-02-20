import { Table, Column, Model, AllowNull, AutoIncrement, PrimaryKey, Unique } from 'sequelize-typescript';

@Table({
    tableName: 'command_usages',
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
    @Unique('user_command')
    @Column
    commandName!: string;

    @AllowNull(false)
    @Column
    count!: number;
}
