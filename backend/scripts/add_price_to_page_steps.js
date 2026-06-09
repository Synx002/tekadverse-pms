const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Adding price column to page_steps table...');

        // Check if column already exists
        const [columns] = await db.execute(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = DATABASE() 
             AND TABLE_NAME = 'page_steps' 
             AND COLUMN_NAME = 'price'`
        );

        if (columns.length > 0) {
            console.log('✓ price column already exists, skipping');
            process.exit(0);
            return;
        }

        await db.execute(`
            ALTER TABLE page_steps 
            ADD COLUMN price DECIMAL(15, 2) DEFAULT 0 AFTER step_name
        `);
        console.log('✓ price column added');

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
