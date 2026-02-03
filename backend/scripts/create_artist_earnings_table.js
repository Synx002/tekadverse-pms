const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Creating artist_earnings table...');

        await db.execute(`
            CREATE TABLE IF NOT EXISTS artist_earnings (
                id INT PRIMARY KEY AUTO_INCREMENT,
                task_id INT NOT NULL,
                artist_id INT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
                status ENUM('pending', 'paid') DEFAULT 'pending',
                paid_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_task_earning (task_id),
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
                FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_artist_id (artist_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ artist_earnings table created');

        // Backfill: create earnings for existing done/approved tasks
        const [existingTasks] = await db.execute(`
            SELECT t.id, t.assigned_to, COALESCE(ps.price, 0) as amount
            FROM tasks t
            LEFT JOIN page_steps ps ON t.step_id = ps.id
            WHERE t.status IN ('done', 'approved') AND t.assigned_to IS NOT NULL
        `);
        for (const row of existingTasks) {
            if (parseFloat(row.amount) > 0) {
                await db.execute(
                    `INSERT IGNORE INTO artist_earnings (task_id, artist_id, amount, status) VALUES (?, ?, ?, 'pending')`,
                    [row.id, row.assigned_to, row.amount]
                );
            }
        }
        console.log(`✓ Backfilled ${existingTasks.length} existing completed tasks`);

        console.log('\n✅ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
