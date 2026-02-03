const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Updating unique constraint on tasks table...');

        // 1. Drop existing FK to page_steps (since we are moving to project_steps)
        // Wait, the existing FK is fk_tasks_step_id. Let's try to drop it.
        try {
            await db.execute('ALTER TABLE tasks DROP FOREIGN KEY fk_tasks_step_id');
            console.log('✓ Dropped old FK constraint fk_tasks_step_id');
        } catch (e) {
            console.log('! Could not drop FK (might not exist or different name):', e.message);
        }

        // 2. Drop the old unique key uk_step_id
        try {
            await db.execute('ALTER TABLE tasks DROP INDEX uk_step_id');
            console.log('✓ Dropped old unique index uk_step_id');
        } catch (e) {
            console.log('! Could not drop unique index (might not exist):', e.message);
        }

        // 2.5 Clear existing step_id to avoid FK violations with the new table
        await db.execute('UPDATE tasks SET step_id = NULL');
        console.log('✓ Cleared existing step_id values in tasks table');

        // 3. Add new composite unique key (page_id, step_id)
        try {
            await db.execute(`
                ALTER TABLE tasks
                ADD UNIQUE KEY uk_page_step (page_id, step_id)
            `);
            console.log('✓ Added new composite unique key uk_page_step (page_id, step_id)');
        } catch (e) {
            console.log('! Composite unique key might already exist:', e.message);
        }

        // 4. Add new FK to project_steps
        try {
            await db.execute(`
                ALTER TABLE tasks
                ADD CONSTRAINT fk_tasks_project_step_id 
                FOREIGN KEY (step_id) REFERENCES project_steps(id) ON DELETE SET NULL
            `);
            console.log('✓ Added new FK constraint to project_steps');
        } catch (e) {
            console.log('! FK to project_steps might already exist:', e.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
