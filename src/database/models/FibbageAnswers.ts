import { DatabaseModelInitializer } from '../../interfaces/DatabaseModel';
import { FibbageAnswerInstance } from '../../interfaces/fibbage/FibbageAnswer';
import { DataTypes } from 'sequelize';

export const initialize: DatabaseModelInitializer<FibbageAnswerInstance> = (
    sequelize
) => {
    return sequelize.define(
        'fibbage_answers',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            answer: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            isCorrect: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
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
