import Database from './DatabaseObject';

if (process.env.DATABASE_PATH) {
    const db = new Database(process.env.DATABASE_PATH);

    db.sync();
} else {
    console.error('DATABASE_PATH env var is not defined');
}
