import { Sequelize } from 'sequelize-typescript';
import { GimmickPoints } from './models/GimmickPoints';

export async function getGimmickPoints(id: string): Promise<GimmickPoints> {
    const points = await GimmickPoints.findOne({ where: { id: id } });
    if (!points) {
        return GimmickPoints.create({ id: id });
    }
    return points;
}

export async function getAllGimmickPoints(): Promise<GimmickPoints[]> {
    return await GimmickPoints.findAll({
        order: Sequelize.literal('points DESC'),
    });
}
