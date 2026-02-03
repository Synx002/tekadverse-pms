const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Starting migration to fix truncation issues...');

        // 1. Fix activity_logs table
        console.log('Updating activity_logs table...');
        await db.execute(`
            ALTER TABLE activity_logs 
            MODIFY COLUMN entity_type VARCHAR(50) DEFAULT NULL,
            MODIFY COLUMN action VARCHAR(100) DEFAULT NULL
        `);
        console.log('✓ activity_logs table updated');

        // 2. Fix notifications table
        console.log('Updating notifications table...');
        await db.execute(`
            ALTER TABLE notifications 
            MODIFY COLUMN type VARCHAR(50) DEFAULT NULL,
            MODIFY COLUMN related_type VARCHAR(50) DEFAULT NULL
        `);
        console.log('✓ notifications table updated');

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
