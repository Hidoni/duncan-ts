import { DatabaseModelInitializer } from '../../interfaces/DatabaseModel';
import { FibbageStatsInstance } from '../../interfaces/fibbage/FibbageStats';
import { DataTypes } from 'sequelize';

export const initialize: DatabaseModelInitializer<FibbageStatsInstance> = (
    sequelize
) => {
    return sequelize.define(
        'fibbage_stats',
        {
            id: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false,
            },
            points: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            timesAnsweredCorrectly: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            timesFooled: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            timesOthersFooled: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            timesOthersAnsweredCorrectly: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
        },
        {
            timestamps: false,
        }
    );
};
