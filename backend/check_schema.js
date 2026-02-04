const db = require('./config/database');

async function checkSchema() {
    try {
        const [columns] = await db.execute('DESCRIBE users');
        console.log('Users table columns:');
        columns.forEach(col => console.log(`- ${col.Field}: ${col.Type}`));
        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();
