import { DatabaseModelInitializer } from '../../interfaces/DatabaseModel';
import { QuestionInstance } from '../../interfaces/question_of_the_day/Question';
import { DataTypes } from 'sequelize';

export const initialize: DatabaseModelInitializer<QuestionInstance> = (
    sequelize
) => {
    return sequelize.define(
        'qotd_questions',
        {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true,
                allowNull: false,
            },
            question: {
                type: DataTypes.TEXT,
                unique: true,
                allowNull: false,
            },
            addedAt: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            authorName: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            used: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            }
        },
        {
            timestamps: false,
            indexes: [
                {
                    fields: ['question'],
                },
            ],
        }
    );
};
