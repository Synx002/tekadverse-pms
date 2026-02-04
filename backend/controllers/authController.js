const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { logActivity } = require('../utils/logger');
const { sendEmail, emailTemplates } = require('../utils/emailService');

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
        await logActivity(result.insertId, 'self_registered', 'user', result.insertId, null, { name, email, role }, req.ip);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                userId: result.insertId
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
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
            'SELECT id, name, email, password, role, profile_picture, is_active, bank_name, bank_account_number, bank_account_holder FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        // Log activity
        await logActivity(user.id, 'login', 'user', user.id, null, null, req.ip);

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    profile_picture: user.profile_picture,
                    bank_name: user.bank_name,
                    bank_account_number: user.bank_account_number,
                    bank_account_holder: user.bank_account_holder
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get current user
exports.getMe = async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, name, email, role, profile_picture, created_at, bank_name, bank_account_number, bank_account_holder FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            data: users[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Forgot Password
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const [users] = await db.execute('SELECT id, name FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found with this email' });
        }

        const user = users[0];
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetExpire = new Date(Date.now() + 3600000); // 1 hour

        await db.execute(
            'UPDATE users SET reset_password_token = ?, reset_password_expire = ? WHERE id = ?',
            [resetToken, resetExpire, user.id]
        );

        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const html = emailTemplates.forgotPassword(resetUrl);

        const emailSent = await sendEmail(email, 'Password Reset Request', html);

        if (!emailSent) {
            return res.status(500).json({ success: false, message: 'Error sending email' });
        }

        res.json({ success: true, message: 'Password reset link sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Reset Password
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const [users] = await db.execute(
            'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expire > ?',
            [token, new Date()]
        );

        if (users.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const user = users[0];
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expire = NULL WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.json({ success: true, message: 'Password has been reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};