const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        let query = 'SELECT id, name, email, role, profile_picture, is_active, bank_name, bank_account_number, bank_account_holder, created_at FROM users WHERE 1=1';
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

// Create new user (Admin only)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role, bank_name, bank_account_number, bank_account_holder } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'Please provide all required fields' });
        }

        // Check if user exists
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Handle profile picture
        const profile_picture = req.file ? req.file.path.replace(/\\/g, '/') : null;

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role, profile_picture, bank_name, bank_account_number, bank_account_holder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [name, email, hashedPassword, role, profile_picture, bank_name || null, bank_account_number || null, bank_account_holder || null]
        );

        // Log activity
        await logActivity(req.user.id, 'created_user', 'user', result.insertId, null, { name, email, role, bank_name }, req.ip);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: result.insertId,
                name,
                email,
                role
            }
        });
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
        const { name, email, role, is_active, password, bank_name, bank_account_number, bank_account_holder } = req.body;

        // Check if user is admin OR updating their own profile
        if (req.user.role !== 'admin' && parseInt(id) !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied. You can only update your own profile.' });
        }

        const [existing] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const oldValue = existing[0];

        // Check email uniqueness if changed
        if (email && email !== oldValue.email) {
            const [emailCheck] = await db.execute('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
            if (emailCheck.length > 0) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        let profile_picture = oldValue.profile_picture;
        if (req.file) {
            profile_picture = req.file.path.replace(/\\/g, '/');
        }

        // Only admins can change role and is_active status
        let updatedRole = oldValue.role;
        let updatedIsActive = oldValue.is_active;

        if (req.user.role === 'admin') {
            if (role) updatedRole = role;
            if (is_active !== undefined) {
                updatedIsActive = is_active === 'true' || is_active === true;
            }
        }

        let query = 'UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, profile_picture = ?, bank_name = ?, bank_account_number = ?, bank_account_holder = ?';
        const params = [
            name || oldValue.name,
            email || oldValue.email,
            updatedRole,
            updatedIsActive,
            profile_picture,
            bank_name !== undefined ? bank_name : oldValue.bank_name,
            bank_account_number !== undefined ? bank_account_number : oldValue.bank_account_number,
            bank_account_holder !== undefined ? bank_account_holder : oldValue.bank_account_holder
        ];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.execute(query, params);

        await logActivity(req.user.id, 'updated_user', 'user', id, oldValue, { name, email, role: updatedRole, is_active: updatedIsActive }, req.ip);

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

        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
        }

        const [existing] = await db.execute('SELECT * FROM users WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        await db.execute('DELETE FROM users WHERE id = ?', [id]);

        await logActivity(req.user.id, 'deleted_user', 'user', id, existing[0], null, req.ip);

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);

        // Handle Foreign Key Constraint error
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete user because they have associated tasks or projects. Try deactivating the account instead.'
            });
        }

        res.status(500).json({ success: false, message: 'Server error' });
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

// Get current user profile
exports.getProfile = async (req, res) => {
    try {
        const [rows] = await db.execute(
            'SELECT id, name, email, role, profile_picture, is_active, bank_name, bank_account_number, bank_account_holder, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = exports;