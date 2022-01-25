import { Model, ModelCtor, Sequelize } from 'sequelize/types';

export interface DatabaseModelInitializer<M extends Model> {
    (sequelize: Sequelize): ModelCtor<M>;
}

export interface DatabaseModel<M extends Model> {
    initializer: DatabaseModelInitializer<M>;
}
