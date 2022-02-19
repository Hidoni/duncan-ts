import { DatabaseModelInitializer } from '../../interfaces/DatabaseModel';
import { FibbageGuessInstance } from '../../interfaces/fibbage/FibbageGuess';
import { DataTypes } from 'sequelize';

export const initialize: DatabaseModelInitializer<FibbageGuessInstance> = (
    sequelize
) => {
    return sequelize.define(
        'fibbage_guesses',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            user: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            answerId: {
                type: DataTypes.INTEGER,
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
