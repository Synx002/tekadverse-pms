const db = require('../config/database');

async function run() {
    const [fks] = await db.execute(`
        SELECT k.CONSTRAINT_NAME, k.COLUMN_NAME, k.REFERENCED_TABLE_NAME,
               r.DELETE_RULE, r.UPDATE_RULE
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
        JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
          ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME
         AND k.CONSTRAINT_SCHEMA = r.CONSTRAINT_SCHEMA
        WHERE k.TABLE_SCHEMA = DATABASE()
          AND k.TABLE_NAME = 'tasks'
          AND k.REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('Foreign keys on tasks:', JSON.stringify(fks, null, 2));

    const [create] = await db.execute('SHOW CREATE TABLE tasks');
    console.log('\n', create[0]['Create Table']);
    process.exit(0);
}

run().catch((e) => { console.error(e); process.exit(1); });
