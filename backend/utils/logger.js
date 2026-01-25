const db = require('../config/database');

const logActivity = async (userId, action, entityType, entityId, oldValue = null, newValue = null, ipAddress = null) => {
    try {
        const query = `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

        await db.execute(query, [
            userId,
            action,
            entityType,
            entityId,
            oldValue ? JSON.stringify(oldValue) : null,
            newValue ? JSON.stringify(newValue) : null,
            ipAddress
        ]);
    } catch (error) {
        console.error('Logging error:', error);
    }
};

module.exports = { logActivity };