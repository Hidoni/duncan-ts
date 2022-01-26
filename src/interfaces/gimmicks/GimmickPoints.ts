import { Model } from "sequelize/types";

export interface GimmickPointsInstance extends Model {
    id: string;
    points: number;
}