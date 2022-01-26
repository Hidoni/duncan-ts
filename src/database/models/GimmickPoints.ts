import { DatabaseModelInitializer } from '../../interfaces/DatabaseModel';
import { GimmickPointsInstance } from '../../interfaces/gimmicks/GimmickPoints';
import { DataTypes } from 'sequelize';

export const initialize: DatabaseModelInitializer<GimmickPointsInstance> = (
    sequelize
) => {
    return sequelize.define(
        'gimmicks_points',
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
        }
    );
};