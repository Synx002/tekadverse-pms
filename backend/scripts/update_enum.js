const db = require('../config/database');

async function migrate() {
    try {
        console.log('Starting migration...');

        // Update the ENUM column to include 'finished'
        await db.execute(`
            ALTER TABLE tasks 
            MODIFY COLUMN status 
            ENUM('todo', 'working', 'finished', 'need_update', 'under_review', 'approved', 'done', 'dropped') 
            DEFAULT 'todo'
        `);

        console.log('✅ Successfully updated tasks status ENUM');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
