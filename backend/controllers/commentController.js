const db = require('../config/database');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Get comments for a task
exports.getCommentsByTask = async (req, res) => {
    try {
        const { task_id } = req.params;

        const [comments] = await db.execute(
            `SELECT c.*, u.name as user_name, u.role, u.profile_picture
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
            [task_id]
        );

        res.json({ success: true, data: comments });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Add comment
exports.addComment = async (req, res) => {
    try {
        const { task_id, comment } = req.body;

        if (!task_id || !comment) {
            return res.status(400).json({ message: 'Task ID and comment are required' });
        }

        // Get task details
        const [tasks] = await db.execute(
            `SELECT t.description, t.assigned_to, t.assigned_by,
              artist.name as artist_name, artist.email as artist_email,
              manager.name as manager_name, manager.email as manager_email,
              ps.step_name, pg.name as page_name, p.name as project_name
       FROM tasks t
       LEFT JOIN users artist ON t.assigned_to = artist.id
       LEFT JOIN users manager ON t.assigned_by = manager.id
       LEFT JOIN project_steps ps ON t.step_id = ps.id
       LEFT JOIN pages pg ON t.page_id = pg.id
       LEFT JOIN projects p ON pg.project_id = p.id
       WHERE t.id = ?`,
            [task_id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = tasks[0];

        const [result] = await db.execute(
            'INSERT INTO comments (task_id, user_id, comment) VALUES (?, ?, ?)',
            [task_id, req.user.id, comment]
        );

        // Determine who to notify (the other person in the conversation)
        let notifyUserId, notifyUserEmail, notifyUserName;

        if (req.user.id === task.assigned_to) {
            // Artist commented, notify manager
            notifyUserId = task.assigned_by;
            notifyUserEmail = task.manager_email;
            notifyUserName = task.manager_name;
        } else {
            // Manager commented, notify artist
            notifyUserId = task.assigned_to;
            notifyUserEmail = task.artist_email;
            notifyUserName = task.artist_name;
        }

        // Get commenter name
        const [commenter] = await db.execute('SELECT name FROM users WHERE id = ?', [req.user.id]);

        // Create notification
        const taskIdentifier = `[${task.project_name}] ${task.page_name} - ${task.step_name || 'Untitled'}`;
        await db.execute(
            `INSERT INTO notifications (user_id, message, type, related_id, related_type)
       VALUES (?, ?, ?, ?, ?)`,
            [
                notifyUserId,
                `${commenter[0].name} commented on task "${taskIdentifier}"`,
                'comment_added',
                task_id,
                'task'
            ]
        );

        // Send email
        if (notifyUserEmail) {
            const emailHtml = emailTemplates.newComment(
                notifyUserName,
                commenter[0].name,
                task.step_name || task.description,
                comment
            );
            await sendEmail(notifyUserEmail, 'New Comment on Task - Tekadverse PMS', emailHtml);
        }

        res.status(201).json({
            message: 'Comment added successfully',
            commentId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete comment
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT * FROM comments WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        // Only the comment owner or admin can delete
        if (req.user.id !== existing[0].user_id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        await db.execute('DELETE FROM comments WHERE id = ?', [id]);

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;