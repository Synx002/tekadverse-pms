const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Removing title column from tasks table...');

        const [columns] = await db.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
             AND TABLE_NAME = 'tasks'
             AND COLUMN_NAME = 'title'`
        );

        if (columns.length === 0) {
            console.log('✓ title column does not exist, skipping');
            process.exit(0);
            return;
        }

        await db.execute('ALTER TABLE tasks DROP COLUMN title');
        console.log('✓ title column dropped');

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
