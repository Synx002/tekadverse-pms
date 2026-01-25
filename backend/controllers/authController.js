const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { logActivity } = require('../utils/logger');

// Register new user (Admin only)
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validation
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Check if user exists
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role]
        );

        // Log activity
        await logActivity(req.user.id, 'created_user', 'user', result.insertId, null, { name, email, role }, req.ip);

        res.status(201).json({
            message: 'User registered successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        // Get user
        const [users] = await db.execute(
            'SELECT id, name, email, password, role, profile_picture, is_active FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({ message: 'Account is deactivated' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Log activity
        await logActivity(user.id, 'login', 'user', user.id, null, null, req.ip);

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile_picture: user.profile_picture
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, name, email, role, profile_picture, created_at FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};