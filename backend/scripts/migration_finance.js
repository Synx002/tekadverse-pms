const db = require('../config/database');

async function runMigration() {
    try {
        console.log('Starting finance migration...');

        // 1. Add bank account fields to users table
        console.log('Adding bank account fields to users table...');

        // Check if columns exist first
        const [columns] = await db.execute('SHOW COLUMNS FROM users');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('bank_name')) {
            await db.execute('ALTER TABLE users ADD COLUMN bank_name VARCHAR(100) DEFAULT NULL');
            console.log('+ bank_name added');
        }
        if (!columnNames.includes('bank_account_number')) {
            await db.execute('ALTER TABLE users ADD COLUMN bank_account_number VARCHAR(50) DEFAULT NULL');
            console.log('+ bank_account_number added');
        }
        if (!columnNames.includes('bank_account_holder')) {
            await db.execute('ALTER TABLE users ADD COLUMN bank_account_holder VARCHAR(100) DEFAULT NULL');
            console.log('+ bank_account_holder added');
        }
        console.log('✓ Users table check complete');

        // 2. Create withdrawals table
        console.log('Creating withdrawals table...');
        await db.execute(`
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INT PRIMARY KEY AUTO_INCREMENT,
                artist_id INT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                bank_info JSON DEFAULT NULL,
                admin_note TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_artist_id (artist_id),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✓ Withdrawals table created');

        console.log('\n✅ Finance migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

runMigration();
