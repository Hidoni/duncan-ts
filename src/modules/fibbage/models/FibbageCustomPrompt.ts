import {
    Table,
    Column,
    Model,
    AllowNull,
    AutoIncrement,
    PrimaryKey,
    HasMany,
} from 'sequelize-typescript';
import { FibbageCustomPromptApproval } from './FibbageCustomPromptApproval';
import { FibbageCustomPromptDefaultAnswer } from './FibbageCustomPromptDefaultAnswer';

@Table({
    modelName: 'fibbage_custom_prompts',
    timestamps: false,
})
export class FibbageCustomPrompt extends Model {
    @AllowNull(false)
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    question!: string;

    @AllowNull(false)
    @Column
    prompt!: string;

    @HasMany(() => FibbageCustomPromptDefaultAnswer, 'customPromptId')
    answers!: FibbageCustomPromptDefaultAnswer[];

    @HasMany(() => FibbageCustomPromptApproval, 'customPromptId')
    approvals!: FibbageCustomPromptApproval[];

    @AllowNull(false)
    @Column
    user!: string;
}
