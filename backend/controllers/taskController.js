const db = require('../config/database');
const { logActivity } = require('../utils/logger');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Get all tasks (with filters)
exports.getAllTasks = async (req, res) => {
    try {
        const { project_id, assigned_to, status, priority, search } = req.query;

        let query = `
      SELECT t.*, 
             p.name as project_name,
             c.name as client_name,
             artist.name as assigned_to_name,
             artist.email as assigned_to_email,
             artist.profile_picture as artist_profile,
             manager.name as assigned_by_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users artist ON t.assigned_to = artist.id
      LEFT JOIN users manager ON t.assigned_by = manager.id
      WHERE 1=1
    `;
        const params = [];

        if (project_id) {
            query += ' AND t.project_id = ?';
            params.push(project_id);
        }

        if (assigned_to) {
            query += ' AND t.assigned_to = ?';
            params.push(assigned_to);
        }

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        if (priority) {
            query += ' AND t.priority = ?';
            params.push(priority);
        }

        if (search) {
            query += ' AND (t.title LIKE ? OR t.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY t.created_at DESC';

        const [tasks] = await db.execute(query, params);
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get my tasks (for artist)
exports.getMyTasks = async (req, res) => {
    try {
        const { status } = req.query;

        let query = `
      SELECT t.*, 
             p.name as project_name,
             c.name as client_name,
             manager.name as assigned_by_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users manager ON t.assigned_by = manager.id
      WHERE t.assigned_to = ?
    `;
        const params = [req.user.id];

        if (status) {
            query += ' AND t.status = ?';
            params.push(status);
        }

        query += ' ORDER BY t.deadline ASC, t.created_at DESC';

        const [tasks] = await db.execute(query, params);
        res.json({ success: true, data: tasks });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get task by ID
exports.getTaskById = async (req, res) => {
    try {
        const { id } = req.params;

        const [tasks] = await db.execute(
            `SELECT t.*, 
              p.name as project_name,
              c.name as client_name,
              artist.name as assigned_to_name,
              artist.email as assigned_to_email,
              manager.name as assigned_by_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN users artist ON t.assigned_to = artist.id
       LEFT JOIN users manager ON t.assigned_by = manager.id
       WHERE t.id = ?`,
            [id]
        );

        if (tasks.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Get comments
        const [comments] = await db.execute(
            `SELECT c.*, u.name as user_name, u.role, u.profile_picture
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.task_id = ?
       ORDER BY c.created_at ASC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...tasks[0],
                comments
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create task
exports.createTask = async (req, res) => {
    try {
        const { project_id, title, description, assigned_to, priority, deadline } = req.body;

        if (!project_id || !title || !assigned_to) {
            return res.status(400).json({ success: false, message: 'Project, title, and assigned artist are required' });
        }

        const [result] = await db.execute(
            `INSERT INTO tasks (project_id, title, description, assigned_to, assigned_by, priority, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [project_id, title, description, assigned_to, req.user.id, priority || 'medium', deadline]
        );

        // Get artist and project details for notification
        const [artist] = await db.execute('SELECT name, email FROM users WHERE id = ?', [assigned_to]);
        const [project] = await db.execute('SELECT name FROM projects WHERE id = ?', [project_id]);

        // Create notification
        await db.execute(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                assigned_to,
                'New Task Assigned',
                `You have been assigned task: ${title}`,
                'task_assigned',
                result.insertId,
                'task'
            ]
        );

        // Send email
        if (artist.length > 0 && project.length > 0) {
            const emailHtml = emailTemplates.taskAssigned(
                artist[0].name,
                title,
                project[0].name,
                deadline || 'Not set'
            );
            await sendEmail(artist[0].email, 'New Task Assigned - Tekadverse PMS', emailHtml);
        }

        await logActivity(req.user.id, 'created_task', 'task', result.insertId, null, { title, assigned_to }, req.ip);

        res.status(201).json({
            success: true,
            message: 'Task created and assigned successfully',
            data: {
                id: result.insertId,
                title,
                project_id,
                assigned_to
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update task status (for artist)
exports.updateTaskStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['todo', 'working', 'need_update', 'under_review', 'approved', 'done', 'dropped'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const [existing] = await db.execute(
            `SELECT t.*, u.name as artist_name, m.email as manager_email, m.name as manager_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users m ON t.assigned_by = m.id
       WHERE t.id = ?`,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = existing[0];

        // Update started_at when status changes to 'working'
        let started_at = task.started_at;
        if (status === 'working' && !started_at) {
            started_at = new Date();
        }

        // Update completed_at when status changes to 'done' or 'approved'
        let completed_at = task.completed_at;
        if ((status === 'done' || status === 'approved') && !completed_at) {
            completed_at = new Date();
        }

        await db.execute(
            'UPDATE tasks SET status = ?, started_at = ?, completed_at = ? WHERE id = ?',
            [status, started_at, completed_at, id]
        );

        // Notify manager
        await db.execute(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                task.assigned_by,
                'Task Status Updated',
                `${task.artist_name} updated task "${task.title}" to ${status}`,
                'task_updated',
                id,
                'task'
            ]
        );

        // Send email to manager
        if (task.manager_email) {
            const emailHtml = emailTemplates.taskStatusUpdated(
                task.manager_name,
                task.title,
                status,
                task.artist_name
            );
            await sendEmail(task.manager_email, 'Task Status Updated - Tekadverse PMS', emailHtml);
        }

        await logActivity(req.user.id, 'updated_task_status', 'task', id, { status: task.status }, { status }, req.ip);

        res.json({ message: 'Task status updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update task (full update - for manager/admin)
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, assigned_to, priority, deadline, status } = req.body;

        const [existing] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await db.execute(
            `UPDATE tasks SET title = ?, description = ?, assigned_to = ?, 
       priority = ?, deadline = ?, status = ? WHERE id = ?`,
            [title, description, assigned_to, priority, deadline, status, id]
        );

        await logActivity(req.user.id, 'updated_task', 'task', id, existing[0], { title, status }, req.ip);

        res.json({ message: 'Task updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        await db.execute('DELETE FROM tasks WHERE id = ?', [id]);

        await logActivity(req.user.id, 'deleted_task', 'task', id, existing[0], null, req.ip);

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get overdue tasks
exports.getOverdueTasks = async (req, res) => {
    try {
        const [tasks] = await db.execute(
            `SELECT t.*, 
              p.name as project_name,
              artist.name as assigned_to_name
       FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       LEFT JOIN users artist ON t.assigned_to = artist.id
       WHERE t.deadline < CURDATE() 
       AND t.status NOT IN ('done', 'approved', 'dropped')
       ORDER BY t.deadline ASC`
        );

        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;