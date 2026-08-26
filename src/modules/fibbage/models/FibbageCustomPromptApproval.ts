import {
    Table,
    Column,
    Model,
    AllowNull,
    AutoIncrement,
    PrimaryKey,
    BelongsTo,
} from 'sequelize-typescript';
import { FibbageCustomPrompt } from './FibbageCustomPrompt';

@Table({
    modelName: 'fibbage_custom_prompt_approvals',
    timestamps: false,
})
export class FibbageCustomPromptApproval extends Model {
    @AllowNull(false)
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    user!: string;

    @BelongsTo(() => FibbageCustomPrompt, 'customPromptId')
    customPrompt!: FibbageCustomPrompt[];
}
