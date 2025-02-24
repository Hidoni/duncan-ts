import {
    Table,
    Column,
    Model,
    AllowNull,
    AutoIncrement,
    PrimaryKey,
} from 'sequelize-typescript';

@Table({
    tableName: 'command_usages',
    timestamps: false,
})
export class CommandUsage extends Model {
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    user!: string;

    @AllowNull(false)
    @Column
    commandName!: string;

    @AllowNull(false)
    @Column
    usedAt!: Date;
}
