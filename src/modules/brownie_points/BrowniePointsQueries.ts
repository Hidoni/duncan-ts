import { Sequelize } from 'sequelize-typescript';
import { BrowniePoints } from './models/BrowniePoints';

export async function getBrowniePoints(id: string): Promise<BrowniePoints> {
    const points = await BrowniePoints.findOne({ where: { id: id } });
    if (!points) {
        return BrowniePoints.create({ id: id });
    }
    return points;
}

export async function getAllBrowniePoints(): Promise<BrowniePoints[]> {
    return await BrowniePoints.findAll({
        order: Sequelize.literal('points DESC'),
    });
}
