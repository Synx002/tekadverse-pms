const db = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all pages for a project
exports.getAllPages = async (req, res) => {
    try {
        const { project_id, status, search } = req.query;

        let query = `
      SELECT p.*, pr.name as project_name,
             u.name as created_by_name,
             COUNT(t.id) as tasks_count,
             SUM(CASE WHEN t.status IN ('done', 'approved') THEN 1 ELSE 0 END) as tasks_completed
      FROM pages p
      LEFT JOIN projects pr ON p.project_id = pr.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN tasks t ON p.id = t.page_id
      WHERE 1=1
    `;
        const params = [];

        if (req.user.role === 'artist') {
            query += ' AND EXISTS (SELECT 1 FROM tasks t2 WHERE t2.page_id = p.id AND t2.assigned_to = ?)';
            params.push(req.user.id);
        }

        if (project_id) {
            query += ' AND p.project_id = ?';
            params.push(project_id);
        }

        if (search) {
            query += ' AND (p.name LIKE ?)';
            params.push(`%${search}%`);
        }

        query += ' GROUP BY p.id ORDER BY p.created_at DESC';

        const [pages] = await db.execute(query, params);
        res.json({ success: true, data: pages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get available steps for a page (steps not yet assigned, or assigned to excludeTaskId when editing)
exports.getAvailableSteps = async (req, res) => {
    try {
        const { id } = req.params;
        const excludeTaskId = req.query.exclude_task_id ? parseInt(req.query.exclude_task_id) : null;

        let allSteps = [];
        try {
            const [steps] = await db.execute(
                `SELECT ps.id, ps.page_id, ps.step_number, ps.step_name, ps.price
                 FROM page_steps ps
                 WHERE ps.page_id = ?
                 ORDER BY ps.step_number ASC`,
                [id]
            );
            allSteps = steps;
        } catch {
            return res.json({ success: true, data: [] });
        }

        let usedSteps = [];
        try {
            const [used] = await db.execute(
                `SELECT step_id, id as task_id FROM tasks WHERE page_id = ? AND step_id IS NOT NULL`,
                [id]
            );
            usedSteps = used;
        } catch {
            // step_id column may not exist yet
        }

        const usedByOtherTask = (stepId) => {
            const used = usedSteps.find(r => r.step_id === stepId);
            return used && (!excludeTaskId || used.task_id !== excludeTaskId);
        };
        const result = allSteps.filter(s => !usedByOtherTask(s.id));

        res.json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get page by ID
exports.getPageById = async (req, res) => {
    try {
        const { id } = req.params;

        const [pages] = await db.execute(
            `SELECT p.*, pr.name as project_name, pr.client_id,
              u.name as created_by_name
       FROM pages p
       LEFT JOIN projects pr ON p.project_id = pr.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
            [id]
        );

        if (pages.length === 0) {
            return res.status(404).json({ success: false, message: 'Page not found' });
        }

        // Check permission for artist
        if (req.user.role === 'artist') {
            const [hasAccess] = await db.execute(
                'SELECT 1 FROM tasks WHERE page_id = ? AND assigned_to = ? LIMIT 1',
                [id, req.user.id]
            );
            if (hasAccess.length === 0) {
                return res.status(403).json({ success: false, message: 'Access denied to this page' });
            }
        }

        // Get steps (page_steps table might not exist if migration not run)
        let steps = [];
        try {
            const [stepsResult] = await db.execute(
                `SELECT id, page_id, step_number, step_name, price, created_at
                 FROM page_steps WHERE page_id = ? ORDER BY step_number ASC`,
                [id]
            );
            steps = stepsResult.map(s => ({ ...s, price: s.price ?? 0 }));
        } catch {
            try {
                const [stepsResult] = await db.execute(
                    `SELECT id, page_id, step_number, step_name, created_at
                     FROM page_steps WHERE page_id = ? ORDER BY step_number ASC`,
                    [id]
                );
                steps = stepsResult.map(s => ({ ...s, price: 0 }));
            } catch {
                // page_steps table may not exist
            }
        }

        // Get tasks (with step info if step_id column exists)
        let tasks;
        try {
            const [tasksResult] = await db.execute(
                `SELECT t.*, u.name as assigned_to_name, u.profile_picture,
                        ps.step_number, ps.step_name, ps.price as step_price
                 FROM tasks t
                 LEFT JOIN users u ON t.assigned_to = u.id
                 LEFT JOIN page_steps ps ON t.step_id = ps.id
                 WHERE t.page_id = ?
                 ORDER BY COALESCE(ps.step_number, 999), t.created_at ASC`,
                [id]
            );
            tasks = tasksResult;
        } catch {
            // Fallback when step_id column doesn't exist (migration not run yet)
            const [tasksResult] = await db.execute(
                `SELECT t.*, u.name as assigned_to_name, u.profile_picture
                 FROM tasks t
                 LEFT JOIN users u ON t.assigned_to = u.id
                 WHERE t.page_id = ?
                 ORDER BY t.created_at DESC`,
                [id]
            );
            tasks = tasksResult;
        }

        res.json({
            success: true,
            data: {
                ...pages[0],
                steps,
                tasks
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


// Create page
exports.createPage = async (req, res) => {
    const connection = await db.getConnection();

    try {
        console.log('=== CREATE PAGE REQUEST ===');
        console.log('User:', req.user);
        console.log('Body:', req.body);

        await connection.beginTransaction();

        const { project_id, name, steps } = req.body;

        // Validasi input
        if (!project_id || !name) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Project and page name are required'
            });
        }

        // Ambil client_id dari project
        const [project] = await connection.execute(
            'SELECT id, client_id FROM projects WHERE id = ?',
            [project_id]
        );

        if (project.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Project not found'
            });
        }

        const client_id = project[0].client_id;
        console.log('Client ID from project:', client_id);

        // Insert page dengan client_id
        const [result] = await connection.execute(
            `INSERT INTO pages (client_id, project_id, name, created_by)
             VALUES (?, ?, ?, ?)`,
            [
                client_id,
                project_id,
                name,
                req.user.id
            ]
        );

        const pageId = result.insertId;

        // Insert steps if provided (hanya sebagai referensi, tidak auto-create tasks)
        if (steps && Array.isArray(steps) && steps.length > 0) {
            for (const step of steps) {
                const price = step.price != null ? parseFloat(step.price) : 0;
                await connection.execute(
                    `INSERT INTO page_steps (page_id, step_number, step_name, price)
                     VALUES (?, ?, ?, ?)`,
                    [pageId, step.step_number, step.step_name, price]
                );
            }
            console.log(`Inserted ${steps.length} steps as reference (no auto-tasks created)`);
        }

        await connection.commit();

        // Log activity (dengan error handling terpisah)
        try {
            await logActivity(
                req.user.id,
                'created_page',
                'page',
                pageId,
                null,
                { name, project_id, client_id, steps_count: steps?.length || 0 },
                req.ip
            );
        } catch (logError) {
            console.error('Failed to log activity:', logError);
        }

        console.log('=== PAGE CREATED SUCCESSFULLY ===');
        res.status(201).json({
            success: true,
            message: 'Page created successfully',
            data: { id: pageId }
        });

    } catch (error) {
        await connection.rollback();
        console.error('=== CREATE PAGE ERROR ===');
        console.error('Error:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    } finally {
        connection.release();
    }
};


// Update page
exports.updatePage = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { name, steps } = req.body;

        const [existing] = await connection.execute('SELECT * FROM pages WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Page not found' });
        }

        await connection.beginTransaction();

        if (name !== undefined) {
            await connection.execute(
                `UPDATE pages SET name = ? WHERE id = ?`,
                [name, id]
            );
        }

        // Update steps if provided
        if (steps && Array.isArray(steps)) {
            for (const step of steps) {
                const price = step.price != null ? parseFloat(step.price) : 0;
                if (step.id) {
                    await connection.execute(
                        `UPDATE page_steps SET step_name = ?, price = ? WHERE id = ? AND page_id = ?`,
                        [step.step_name, price, step.id, id]
                    );
                } else {
                    await connection.execute(
                        `INSERT INTO page_steps (page_id, step_number, step_name, price)
                         VALUES (?, ?, ?, ?)`,
                        [id, step.step_number, step.step_name, price]
                    );
                }
            }
        }

        await connection.commit();
        await logActivity(req.user.id, 'updated_page', 'page', id, existing[0], { name, steps_count: steps?.length }, req.ip);

        res.json({ success: true, message: 'Page updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        connection.release();
    }
};

// Delete page
exports.deletePage = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT * FROM pages WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Page not found' });
        }

        await db.execute('DELETE FROM pages WHERE id = ?', [id]);

        await logActivity(req.user.id, 'deleted_page', 'page', id, existing[0], null, req.ip);

        res.json({ success: true, message: 'Page deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
