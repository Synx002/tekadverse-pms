const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Adding step_id column to tasks table...');

        // Add step_id column
        await db.execute(`
            ALTER TABLE tasks 
            ADD COLUMN step_id INT NULL AFTER page_id
        `);
        console.log('✓ step_id column added');

        // Add foreign key constraint
        await db.execute(`
            ALTER TABLE tasks
            ADD CONSTRAINT fk_tasks_step_id 
            FOREIGN KEY (step_id) REFERENCES page_steps(id) ON DELETE SET NULL
        `);
        console.log('✓ Foreign key constraint added');

        // Add unique constraint to ensure one task per step
        await db.execute(`
            ALTER TABLE tasks
            ADD UNIQUE KEY uk_step_id (step_id)
        `);
        console.log('✓ Unique constraint added');

        // Add index for better query performance
        await db.execute(`
            CREATE INDEX idx_tasks_step_id ON tasks(step_id)
        `);
        console.log('✓ Index created');

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

runMigration();
