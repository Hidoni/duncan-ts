import { Logger } from 'log4js';

import { ModelCtor, Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';

interface UserVersionQueryResult {
    user_version: number;
}

export default class Database {
    private sequelize: Sequelize;

    public constructor(database: string, models: ModelCtor[], logger?: Logger) {
        this.sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: database,
            logging: logger?.log.bind(logger, 'sql'),
            models: models,
        });
        this.sync();
    }

    public sync(): void {
        this.sequelize.sync();
    }

    public async getDatabaseVersion(): Promise<number> {
        const results: UserVersionQueryResult[] = await this.sequelize.query(
            'PRAGMA user_version;',
            {
                type: QueryTypes.SELECT, // This pragma is equivalent to a SELECT in terms of its output.
            }
        );
        return results[0].user_version;
    }

    public async setDatabaseVersion(version: number): Promise<void> {
        await this.sequelize.query(`PRAGMA user_version = ${version};`);
    }
}
