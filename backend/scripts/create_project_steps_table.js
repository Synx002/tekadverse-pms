const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Starting migration: Create project_steps table...');

        const sql = `
            CREATE TABLE IF NOT EXISTS project_steps (
                id INT AUTO_INCREMENT PRIMARY KEY,
                project_id INT NOT NULL,
                step_number INT NOT NULL,
                step_name VARCHAR(255) NOT NULL,
                price DECIMAL(15, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            )
        `;

        await db.execute(sql);
        console.log('✅ Table project_steps created successfully');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
