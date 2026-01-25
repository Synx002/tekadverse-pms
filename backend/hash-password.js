const bcrypt = require('bcryptjs');
const fs = require('fs');

const passwords = {
    admin: 'admin123',
    manager: 'manager123',
    artist: 'artist123'
};

(async () => {
    let output = '';
    for (const role of Object.keys(passwords)) {
        const hash = await bcrypt.hash(passwords[role], 10);
        const sql = `INSERT INTO users (name, email, password, role, is_active) VALUES ('${role}', '${role}@tekadverse.com', '${hash}', '${role}', 1);\n`;
        output += `\n${role.toUpperCase()}:\nPassword: ${passwords[role]}\nHash: ${hash}\nSQL: ${sql}`;
    }
    fs.writeFileSync('sql_output.txt', output);
    console.log('Results saved to sql_output.txt');
})();