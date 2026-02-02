const db = require('../config/database');
const { logActivity } = require('../utils/logger');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Create artist earning when task becomes done/approved
async function createArtistEarningIfDone(taskId) {
    try {
        const [task] = await db.execute(
            `SELECT t.assigned_to, t.step_id, t.status,
                    COALESCE(ps.price, 0) as step_price
             FROM tasks t
             LEFT JOIN page_steps ps ON t.step_id = ps.id
             WHERE t.id = ?`,
            [taskId]
        );
        if (task.length === 0 || !task[0].assigned_to) return;
        const t = task[0];
        if (!['done', 'approved'].includes(t.status)) return;
        const amount = parseFloat(t.step_price) || 0;
        if (amount <= 0) return;

        await db.execute(
            `INSERT IGNORE INTO artist_earnings (task_id, artist_id, amount, status) VALUES (?, ?, ?, 'pending')`,
            [taskId, t.assigned_to, amount]
        );
    } catch (e) {
        console.error('createArtistEarningIfDone:', e.message);
    }
}

// Get all tasks (with filters)
exports.getAllTasks = async (req, res) => {
    try {
        const { page_id, assigned_to, status, priority, search } = req.query;

        // Role-based visibility logic
        let filterAssignedTo = assigned_to;
        if (req.user.role === 'artist') {
            if (page_id) {
                // If filtering by page, check if artist belongs to that page
                const [access] = await db.execute(
                    'SELECT 1 FROM tasks WHERE page_id = ? AND assigned_to = ? LIMIT 1',
                    [page_id, req.user.id]
                );
                if (access.length === 0) {
                    return res.status(403).json({ success: false, message: 'Access denied to this page' });
                }
                // If they have access, we don't force assigned_to filter
                // They can see everyone's tasks in this page
            } else {
                // Global view: artists only see their own tasks
                filterAssignedTo = req.user.id;
            }
        }

        let query = `
      SELECT t.*, 
             pg.name as page_name,
             p.name as project_name,
             c.name as client_name,
             artist.name as assigned_to_name,
             artist.email as assigned_to_email,
             artist.profile_picture as artist_profile,
             manager.name as assigned_by_name,
             ps.step_number, ps.step_name, ps.price as step_price
      FROM tasks t
      LEFT JOIN pages pg ON t.page_id = pg.id
      LEFT JOIN page_steps ps ON t.step_id = ps.id
      LEFT JOIN projects p ON pg.project_id = p.id
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users artist ON t.assigned_to = artist.id
      LEFT JOIN users manager ON t.assigned_by = manager.id
      WHERE 1=1
    `;
        const params = [];

        if (page_id) {
            query += ' AND t.page_id = ?';
            params.push(page_id);
        }

        if (filterAssignedTo) {
            query += ' AND t.assigned_to = ?';
            params.push(filterAssignedTo);
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
              pg.name as page_name,
              p.name as project_name,
              c.name as client_name,
              artist.name as assigned_to_name,
              artist.email as assigned_to_email,
              manager.name as assigned_by_name,
              ps.step_number, ps.step_name
       FROM tasks t
       LEFT JOIN pages pg ON t.page_id = pg.id
       LEFT JOIN page_steps ps ON t.step_id = ps.id
       LEFT JOIN projects p ON pg.project_id = p.id
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
        const { page_id, step_id, title, description, assigned_to, priority, deadline } = req.body;

        if (!page_id || !title || !assigned_to) {
            return res.status(400).json({ success: false, message: 'Page, title, and assigned artist are required' });
        }

        // Validate step: required and must belong to page
        if (!step_id) {
            return res.status(400).json({ success: false, message: 'Step must be selected' });
        }

        const [stepCheck] = await db.execute(
            'SELECT id, page_id FROM page_steps WHERE id = ?',
            [step_id]
        );
        if (stepCheck.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid step' });
        }
        if (stepCheck[0].page_id !== parseInt(page_id)) {
            return res.status(400).json({ success: false, message: 'Step does not belong to selected page' });
        }

        // Check if step is already used by another task
        const [existingTask] = await db.execute(
            'SELECT id FROM tasks WHERE step_id = ?',
            [step_id]
        );
        if (existingTask.length > 0) {
            return res.status(400).json({ success: false, message: 'This step is already assigned to another task' });
        }

        const [result] = await db.execute(
            `INSERT INTO tasks (page_id, step_id, title, description, assigned_to, assigned_by, priority, deadline)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [page_id, step_id, title, description, assigned_to, req.user.id, priority || 'medium', deadline]
        );

        // Get artist and Page details for notification
        const [artist] = await db.execute('SELECT name, email FROM users WHERE id = ?', [assigned_to]);
        const [page] = await db.execute('SELECT name FROM pages WHERE id = ?', [page_id]);

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
        if (artist.length > 0 && page.length > 0) {
            const emailHtml = emailTemplates.taskAssigned(
                artist[0].name,
                title,
                page[0].name,
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
                page_id,
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

        const validStatuses = ['todo', 'working', 'finished', 'need_update', 'under_review', 'approved', 'done', 'dropped'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Role-based status restrictions
        if (req.user.role === 'artist') {
            const allowedForArtist = ['todo', 'working', 'finished'];
            if (!allowedForArtist.includes(status)) {
                return res.status(403).json({ message: 'Artists can only move tasks to Todo, Working, or Finished' });
            }
        }

        if (req.user.role === 'manager') {
            if (status === 'done') {
                return res.status(403).json({ message: 'Only Admins can mark tasks as Done' });
            }
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

        // Check if artist is trying to update a locked task
        if (req.user.role === 'artist') {
            const lockedStatuses = ['need_update', 'under_review', 'approved', 'done'];
            if (lockedStatuses.includes(task.status)) {
                return res.status(403).json({ message: 'Artists cannot update tasks in this status' });
            }
        }

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

        if (['done', 'approved'].includes(status)) {
            await createArtistEarningIfDone(id);
        }

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
        let { step_id, title, description, assigned_to, priority, deadline, status } = req.body;

        const [existing] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = existing[0];

        // Validate status if provided
        if (status) {
            const validStatuses = ['todo', 'working', 'finished', 'need_update', 'under_review', 'approved', 'done', 'dropped'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
        }

        // Validate step_id if provided (for manager/admin only)
        if (step_id !== undefined && req.user.role !== 'artist') {
            const [stepCheck] = await db.execute(
                'SELECT id, page_id FROM page_steps WHERE id = ?',
                [step_id]
            );
            if (stepCheck.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid step' });
            }
            if (stepCheck[0].page_id !== task.page_id) {
                return res.status(400).json({ success: false, message: 'Step does not belong to this page' });
            }
            const [existingTask] = await db.execute(
                'SELECT id FROM tasks WHERE step_id = ? AND id != ?',
                [step_id, id]
            );
            if (existingTask.length > 0) {
                return res.status(400).json({ success: false, message: 'This step is already assigned to another task' });
            }
        }

        // Restrict artist to only update status
        if (req.user.role === 'artist') {
            // Check if artist is trying to update a locked task
            const lockedStatuses = ['need_update', 'under_review', 'approved', 'done'];
            if (lockedStatuses.includes(task.status)) {
                return res.status(403).json({ message: 'Artists cannot update tasks in this status' });
            }

            // Force reset restricted fields to existing values
            step_id = task.step_id;
            title = task.title;
            description = task.description;
            assigned_to = task.assigned_to;
            priority = task.priority;
            deadline = task.deadline;
        } else if (step_id === undefined) {
            step_id = task.step_id;
        }

        await db.execute(
            `UPDATE tasks SET step_id = ?, title = ?, description = ?, assigned_to = ?, 
       priority = ?, deadline = ?, status = ? WHERE id = ?`,
            [step_id, title, description, assigned_to, priority, deadline, status, id]
        );

        if (['done', 'approved'].includes(status)) {
            await createArtistEarningIfDone(id);
        }

        // Notify artist if manager updates the task
        if (req.user.role !== 'artist' && task.assigned_to) {
            await db.execute(
                `INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
        VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    task.assigned_to,
                    'Task Updated',
                    `Your task "${title || task.title}" has been updated by ${req.user.name}${status ? ` to ${status}` : ''}`,
                    'task_updated_by_manager',
                    id,
                    'task'
                ]
            );
        }

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
        let query = `
      SELECT t.*, 
             p.name as project_name,
             artist.name as assigned_to_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users artist ON t.assigned_to = artist.id
      WHERE t.deadline < CURDATE() 
      AND t.status NOT IN ('done', 'approved', 'dropped')
    `;
        const params = [];

        if (req.user.role === 'artist') {
            query += ' AND t.assigned_to = ?';
            params.push(req.user.id);
        }

        query += ' ORDER BY t.deadline ASC';

        const [tasks] = await db.execute(query, params);

        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;