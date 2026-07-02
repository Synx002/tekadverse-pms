const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Dropping page_steps table (steps now use project_steps only)...');

        const [tables] = await db.execute(
            `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'page_steps'`
        );

        if (tables.length === 0) {
            console.log('✓ page_steps table does not exist, nothing to drop');
            process.exit(0);
            return;
        }

        await db.execute('DROP TABLE page_steps');
        console.log('✓ page_steps table dropped');

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
