const db = require('../config/database');

async function run() {
    try {
        console.log('Fixing tasks.step_id foreign key (SET NULL → RESTRICT)...');

        const [fks] = await db.execute(`
            SELECT CONSTRAINT_NAME, DELETE_RULE
            FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'tasks'
              AND CONSTRAINT_NAME = 'fk_tasks_project_step_id'
        `);

        if (fks.length === 0) {
            console.log('Adding fk_tasks_project_step_id with ON DELETE RESTRICT...');
            await db.execute(`
                ALTER TABLE tasks
                ADD CONSTRAINT fk_tasks_project_step_id
                FOREIGN KEY (step_id) REFERENCES project_steps(id)
                ON DELETE RESTRICT ON UPDATE CASCADE
            `);
        } else if (fks[0].DELETE_RULE === 'SET NULL') {
            await db.execute(`
                ALTER TABLE tasks DROP FOREIGN KEY fk_tasks_project_step_id
            `);
            await db.execute(`
                ALTER TABLE tasks
                ADD CONSTRAINT fk_tasks_project_step_id
                FOREIGN KEY (step_id) REFERENCES project_steps(id)
                ON DELETE RESTRICT ON UPDATE CASCADE
            `);
            console.log('✓ FK changed to ON DELETE RESTRICT');
        } else {
            console.log(`✓ FK already OK (DELETE_RULE=${fks[0].DELETE_RULE})`);
        }

        console.log('\n✅ Migration completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

run();
