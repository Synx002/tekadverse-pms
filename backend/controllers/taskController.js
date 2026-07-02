const db = require('../config/database');
const { logActivity } = require('../utils/logger');
const { sendEmail, emailTemplates } = require('../utils/emailService');

// Create artist earning when task becomes done
async function createArtistEarningIfDone(taskId) {
    try {
        const [task] = await db.execute(
            `SELECT t.assigned_to, t.status, COALESCE(t.price, 0) as task_price
             FROM tasks t
             WHERE t.id = ?`,
            [taskId]
        );
        if (task.length === 0 || !task[0].assigned_to) return;
        const t = task[0];
        // Only create earning when task status is 'done'
        if (!['done'].includes(t.status)) return;
        const amount = parseFloat(t.task_price) || 0;
        if (amount <= 0) return;

        await db.execute(
            `INSERT IGNORE INTO artist_earnings (task_id, artist_id, amount, status) VALUES (?, ?, ?, 'pending')`,
            [taskId, t.assigned_to, amount]
        );
    } catch (e) {
        console.error('createArtistEarningIfDone:', e.message);
    }
}

// STEP 2: Helper untuk menarik kembali/menghapus earning yang salah akibat status 'approved'
async function revertArtistEarningIfApproved(taskId) {
    try {
        // 1. Cek dulu apakah data earning-nya ada dan bagaimana statusnya
        const [earningRows] = await db.execute(
            `SELECT id, status, amount, artist_id FROM artist_earnings WHERE task_id = ?`,
            [taskId]
        );

        if (earningRows.length === 0) {
            console.log(`revertArtistEarningIfApproved: Tidak ada data earning untuk Task ID ${taskId}`);
            return { success: true, message: 'Tidak ada earning yang perlu dihapus.' };
        }

        const earning = earningRows[0];

        // 2. Jika statusnya 'pending', ini sangat aman untuk langsung dihapus
        if (earning.status === 'pending') {

            // OPTIONAL: Jika Anda punya tabel withdrawal_requests yang mencatat id earning ini, 
            // pastikan untuk memutuskan relasinya atau menghapus request withdrawal yang masih pending terlebih dahulu.
            // Contoh query jika ada tabel withdrawal:
            // await db.execute(`DELETE FROM withdrawal_requests WHERE earning_id = ? AND status = 'pending'`, [earning.id]);

            await db.execute(
                `DELETE FROM artist_earnings WHERE id = ?`,
                [earning.id]
            );

            console.log(`revertArtistEarningIfApproved: Berhasil menghapus pending earning untuk Task ID ${taskId}`);
            return { success: true, mode: 'deleted', message: 'Earning yang berstatus pending berhasil dihapus.' };
        }

        // 3. Jika statusnya SUDAH BUKAN pending (misal: 'withdrawn' atau 'processing')
        else {
            console.warn(`[WARNING] revertArtistEarningIfApproved: Earning Task ID ${taskId} tidak bisa dihapus karena statusnya sudah: ${earning.status}`);

            // Alih-alih menghapus, kita tandai atau biarkan agar Admin memeriksa manual keuangan artist tersebut
            return {
                success: false,
                mode: 'locked',
                message: `Earning tidak bisa dihapus karena status dana sudah '${earning.status}'. Diperlukan tindakan manual oleh Admin.`
            };
        }

    } catch (e) {
        console.error('Error di revertArtistEarningIfApproved:', e.message);
        throw e; // Lemparkan error agar ditangkap oleh fungsi pembungkusnya (Controller Endpoint)
    }
}

// STEP 3: Endpoint untuk memicu pembatalan/penghapusan earning yang salah
exports.revertEarning = async (req, res) => {
    try {
        const { id } = req.params; // Mengambil Task ID dari URL parameters

        // 1. Proteksi Keamanan: Pastikan hanya Admin atau Manager yang boleh mengakses
        const allowedRoles = ['admin', 'manager'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Hanya Admin atau Manager yang dapat membatalkan earning.'
            });
        }

        // 2. Cek apakah task tersebut memang ada di database
        const [taskCheck] = await db.execute('SELECT id, status FROM tasks WHERE id = ?', [id]);
        if (taskCheck.length === 0) {
            return res.status(404).json({ success: false, message: 'Task tidak ditemukan.' });
        }

        // 3. Panggil fungsi helper dari Step 2
        const result = await revertArtistEarningIfApproved(id);

        // 4. Jika helper mengembalikan kegagalan (misal: karena status dana sudah di-withdraw / bukan pending)
        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        // 5. Catat ke log aktivitas jika berhasil dihapus
        if (result.mode === 'deleted') {
            await logActivity(
                req.user.id,
                'reverted_artist_earning',
                'task',
                id,
                null,
                { note: 'Earning dihapus karena status task sebelumnya dirubah ke approved, bukan done' },
                req.ip
            );
        }

        // 6. Kirim respon sukses ke client
        return res.json({
            success: true,
            message: result.message
        });

    } catch (error) {
        console.error('Error di exports.revertEarning:', error);
        return res.status(500).json({ success: false, message: 'Server error saat memproses pembatalan earning.' });
    }
};

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
             ps.step_number, ps.step_name
      FROM tasks t
      LEFT JOIN pages pg ON t.page_id = pg.id
      LEFT JOIN project_steps ps ON t.step_id = ps.id
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
            query += ' AND (ps.step_name LIKE ? OR t.description LIKE ?)';
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
              ps.step_number, ps.step_name, ps.price as step_price
       FROM tasks t
       LEFT JOIN pages pg ON t.page_id = pg.id
       LEFT JOIN project_steps ps ON t.step_id = ps.id
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
        const { page_id, step_id, description, assigned_to, priority, deadline, price } = req.body;

        if (!page_id || !assigned_to) {
            return res.status(400).json({ success: false, message: 'Page and assigned artist are required' });
        }

        if (!step_id) {
            return res.status(400).json({ success: false, message: 'Step must be selected' });
        }

        const [pageRows] = await db.execute('SELECT project_id FROM pages WHERE id = ?', [page_id]);
        if (pageRows.length === 0) {
            return res.status(400).json({ success: false, message: 'Page not found' });
        }

        const [stepCheck] = await db.execute(
            'SELECT id, project_id, step_name, price as step_default_price FROM project_steps WHERE id = ?',
            [step_id]
        );
        if (stepCheck.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid step' });
        }
        if (stepCheck[0].project_id !== pageRows[0].project_id) {
            return res.status(400).json({ success: false, message: 'Step does not belong to this project' });
        }

        const stepName = stepCheck[0].step_name;
        // Use custom price from request, fallback to step default price
        const taskPrice = (price !== undefined && price !== null && price !== '')
            ? parseFloat(price)
            : parseFloat(stepCheck[0].step_default_price || 0);

        const [existingTask] = await db.execute(
            'SELECT id FROM tasks WHERE page_id = ? AND step_id = ?',
            [page_id, step_id]
        );
        if (existingTask.length > 0) {
            return res.status(400).json({ success: false, message: 'This step is already assigned on this page' });
        }

        const [result] = await db.execute(
            `INSERT INTO tasks (page_id, step_id, description, assigned_to, assigned_by, priority, deadline, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [page_id, step_id, description, assigned_to, req.user.id, priority || 'medium', deadline, taskPrice]
        );

        const [artist] = await db.execute('SELECT name, email FROM users WHERE id = ?', [assigned_to]);
        const [page] = await db.execute('SELECT name FROM pages WHERE id = ?', [page_id]);

        await db.execute(
            `INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
            [
                assigned_to,
                'New Task Assigned',
                `You have been assigned: ${stepName}`,
                'task_assigned',
                result.insertId,
                'task'
            ]
        );

        if (artist.length > 0 && page.length > 0) {
            const emailHtml = emailTemplates.taskAssigned(
                artist[0].name,
                stepName,
                page[0].name,
                deadline || 'Not set'
            );
            await sendEmail(artist[0].email, 'New Task Assigned - Tekadverse PMS', emailHtml);
        }

        await logActivity(req.user.id, 'created_task', 'task', result.insertId, null, { step_name: stepName, assigned_to, price: taskPrice }, req.ip);

        res.status(201).json({
            success: true,
            message: 'Task created and assigned successfully',
            data: {
                id: result.insertId,
                step_id,
                step_name: stepName,
                page_id,
                assigned_to,
                price: taskPrice
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
        let { status } = req.body;

        const validStatuses = ['todo', 'work in progress', 'finished', 'need_update', 'under_review', 'approved', 'done', 'dropped'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        // Role-based status restrictions
        if (req.user.role === 'artist') {
            const allowedForArtist = ['todo', 'work in progress', 'finished'];
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
            `SELECT t.*, u.name as artist_name, m.email as manager_email, m.name as manager_name,
              ps.step_name
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       LEFT JOIN users m ON t.assigned_by = m.id
       LEFT JOIN project_steps ps ON t.step_id = ps.id
       WHERE t.id = ?`,
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = existing[0];

        // Check if artist is trying to update a locked task
        // Membatasi artist untuk memperbarui status dengan aman
        if (req.user.role === 'artist') {
            // 1. Cek status yang dikunci (locked)
            const lockedStatuses = ['need_update', 'under_review', 'approved', 'done'];
            if (lockedStatuses.includes(task.status)) {
                return res.status(403).json({ message: 'Artists cannot update tasks in this status' });
            }

            // 2. Validasi status yang masuk jika mereka mencoba mengubahnya
            if (status && status !== task.status) {
                const allowedForArtist = ['todo', 'work in progress', 'finished'];
                if (!allowedForArtist.includes(status)) {
                    return res.status(403).json({ message: 'Artists can only move tasks to Todo, Working, or Finished' });
                }
            }

            // 3. Cegah overwrite NULL: gunakan status yang ada di database jika payload kosong
            status = status || task.status;
        } else {
            // Default untuk Manager/Admin jika field tidak dikirim di payload
            if (status === undefined) status = task.status;
        }

        // Update started_at when status changes to 'working'
        let started_at = task.started_at;
        if (status === 'work in progress' && !started_at) {
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

        if (['done'].includes(status)) {
            await createArtistEarningIfDone(id);
        }

        // Notify manager
        if (task.assigned_by) {
            await db.execute(
                `INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
           VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    task.assigned_by,
                    'Task Status Updated',
                    `${task.artist_name} updated "${task.step_name || 'task'}" to ${status}`,
                    'task_updated',
                    id,
                    'task'
                ]
            );
        }

        // Send email to manager
        if (task.manager_email) {
            const emailHtml = emailTemplates.taskStatusUpdated(
                task.manager_name,
                task.step_name || 'Task',
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
        let { step_id, description, assigned_to, priority, deadline, status, price } = req.body;

        const [existing] = await db.execute('SELECT * FROM tasks WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const task = existing[0];

        // Validate status if provided
        if (status) {
            const validStatuses = ['todo', 'work in progress', 'finished', 'need_update', 'under_review', 'approved', 'done', 'dropped'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
        }

        // Validate step_id if provided (for manager/admin only)
        if (step_id !== undefined && req.user.role !== 'artist') {
            const [pageRows] = await db.execute('SELECT project_id FROM pages WHERE id = ?', [task.page_id]);
            const [stepCheck] = await db.execute(
                'SELECT id, project_id FROM project_steps WHERE id = ?',
                [step_id]
            );
            if (stepCheck.length === 0) {
                return res.status(400).json({ success: false, message: 'Invalid step' });
            }
            if (pageRows.length === 0 || stepCheck[0].project_id !== pageRows[0].project_id) {
                return res.status(400).json({ success: false, message: 'Step does not belong to this project' });
            }
            const [existingTask] = await db.execute(
                'SELECT id FROM tasks WHERE page_id = ? AND step_id = ? AND id != ?',
                [task.page_id, step_id, id]
            );
            if (existingTask.length > 0) {
                return res.status(400).json({ success: false, message: 'This step is already assigned on this page' });
            }
        }

        // Resolve price: artist cannot update price
        let taskPrice;
        if (req.user.role === 'artist') {
            // Artist: force reset restricted fields to existing values
            const lockedStatuses = ['need_update', 'under_review', 'approved', 'done'];
            if (lockedStatuses.includes(task.status)) {
                return res.status(403).json({ message: 'Artists cannot update tasks in this status' });
            }
            step_id = task.step_id;
            description = task.description;
            assigned_to = task.assigned_to;
            priority = task.priority;
            deadline = task.deadline;
            taskPrice = task.price; // artist cannot change price
        } else {
            if (step_id === undefined) step_id = task.step_id;
            // Manager/admin: use provided price or keep existing
            // Prevent changing price if task is already done to avoid earning inconsistencies
            if (task.status === 'done') {
                taskPrice = task.price;
            } else {
                taskPrice = (price !== undefined && price !== null && price !== '')
                    ? parseFloat(price)
                    : task.price;
            }
        }

        await db.execute(
            `UPDATE tasks SET step_id = ?, description = ?, assigned_to = ?,
       priority = ?, deadline = ?, status = ?, price = ? WHERE id = ?`,
            [step_id, description, assigned_to, priority, deadline, status, taskPrice, id]
        );

        if (['done'].includes(status)) {
            await createArtistEarningIfDone(id);
        }

        await logActivity(req.user.id, 'updated_task', 'task', id, existing[0], { status, price: taskPrice }, req.ip);

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