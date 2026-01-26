const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        let query = 'SELECT id, name, email, role, profile_picture, is_active, created_at FROM users WHERE 1=1';
        const params = [];

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        if (search) {
            query += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [users] = await db.execute(query, params);
        res.json({ success: true, data: users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get artists only (For manager to assign tasks)
exports.getArtists = async (req, res) => {
    try {
        const [artists] = await db.execute(
            'SELECT id, name, email, profile_picture FROM users WHERE role = ? AND is_active = TRUE',
            ['artist']
        );
        res.json({ success: true, data: artists });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Update user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, is_active } = req.body;

        const [existing] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const oldValue = existing[0];

        await db.execute(
            'UPDATE users SET name = ?, email = ?, role = ?, is_active = ? WHERE id = ?',
            [name, email, role, is_active, id]
        );

        await logActivity(req.user.id, 'updated_user', 'user', id, oldValue, { name, email, role, is_active }, req.ip);

        res.json({ success: true, message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        await logActivity(req.user.id, 'deleted_user', 'user', id, existing[0], null, req.ip);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const filePath = req.file.path.replace(/\\/g, '/');

        await db.execute(
            'UPDATE users SET profile_picture = ? WHERE id = ?',
            [filePath, req.user.id]
        );

        res.json({
            message: 'Profile picture uploaded successfully',
            filePath
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;