import { Model } from "sequelize/types";

export interface QuestionInstance extends Model {
    id: number;
    question: string;
    authorName: string;
    used: boolean;
    createdAt: Date;
    updatedAt: Date;
}