const db = require('../config/database');

// Get notifications for current user
exports.getMyNotifications = async (req, res) => {
    try {
        const { is_read } = req.query;

        let query = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [req.user.id];

        if (is_read !== undefined) {
            query += ' AND is_read = ?';
            params.push(is_read);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const [notifications] = await db.execute(query, params);
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const [result] = await db.execute(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [req.user.id]
        );

        res.json({ success: true, data: { count: result[0].count } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
    try {
        await db.execute(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [req.user.id]
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create a new notification
exports.createNotification = async (userId, type, message, relatedType = null, relatedId = null) => {
    try {
        // Use type as title if needed, or translate it
        // const title = type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        await db.execute(
            'INSERT INTO notifications (user_id, message, type, related_type, related_id) VALUES (?, ?, ?, ?, ?)',
            [userId, message, type, relatedType, relatedId]
        );
        return true;
    } catch (error) {
        console.error('Error creating notification:', error);
        return false;
    }
};

module.exports = exports;