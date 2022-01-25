import { Model } from "sequelize/types";

export interface QuestionInstance extends Model {
    id: number;
    question: string;
    addedAt: Date;
    authorName: string | null;
    used: boolean;
}