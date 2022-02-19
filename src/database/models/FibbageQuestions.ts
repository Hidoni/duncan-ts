import { DatabaseModelInitializer } from '../../interfaces/DatabaseModel';
import { FibbageQuestionInstance } from '../../interfaces/fibbage/FibbageQuestion';
import { DataTypes } from 'sequelize';

export const initialize: DatabaseModelInitializer<FibbageQuestionInstance> = (
    sequelize
) => {
    return sequelize.define(
        'fibbage_questions',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            question: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            answer: {
                type: DataTypes.TEXT,
                allowNull: true,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            state: {
                type: DataTypes.ENUM(
                    'ASKED',
                    'ANSWERED',
                    'PROMPTED',
                    'IN_USE',
                    'DONE',
                    'SKIPPED'
                ),
                allowNull: false,
                defaultValue: 'ASKED',
            },
            message: {
                type: DataTypes.STRING,
                allowNull: true,
            },
        },
        {
            timestamps: false,
            indexes: [
                {
                    fields: ['user'],
                },
            ],
        }
    );
};
