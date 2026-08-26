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
    modelName: 'fibbage_custom_prompt_default_answers',
    timestamps: false,
})
export class FibbageCustomPromptDefaultAnswer extends Model {
    @AllowNull(false)
    @AutoIncrement
    @PrimaryKey
    @Column
    id!: number;

    @AllowNull(false)
    @Column
    answer!: string;

    @BelongsTo(() => FibbageCustomPrompt, 'customPromptId')
    customPrompt!: FibbageCustomPrompt[];
}
