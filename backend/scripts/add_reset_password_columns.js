const db = require('../config/database');

async function addResetPasswordColumns() {
    try {
        console.log('Adding reset password columns to users table...');

        await db.execute(`
            ALTER TABLE users 
            ADD COLUMN reset_password_token VARCHAR(255) DEFAULT NULL,
            ADD COLUMN reset_password_expire DATETIME DEFAULT NULL
        `);

        console.log('Columns added successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error adding columns:', error);
        process.exit(1);
    }
}

addResetPasswordColumns();
