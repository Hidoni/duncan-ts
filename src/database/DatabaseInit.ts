import path from 'path';
import { collectModels, discoverModules } from '../client/ModuleManager';
import Database from './DatabaseObject';

if (process.env.DATABASE_PATH) {
    const modules = discoverModules(path.join(__dirname, '..', 'modules'));
    const db = new Database(process.env.DATABASE_PATH, collectModels(modules));

    db.sync();
} else {
    console.error('DATABASE_PATH env var is not defined');
}
