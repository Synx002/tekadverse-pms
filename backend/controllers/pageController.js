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

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY p.id ORDER BY p.created_at DESC';

        const [pages] = await db.execute(query, params);
        res.json({ success: true, data: pages });
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

        // Get tasks
        let tasksQuery = `
            SELECT t.*, u.name as assigned_to_name, u.profile_picture
            FROM tasks t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.page_id = ?
            ORDER BY t.created_at DESC
        `;
        const tasksParams = [id];

        const [tasks] = await db.execute(tasksQuery, tasksParams);

        res.json({
            success: true,
            data: {
                ...pages[0],
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
    try {
        const { project_id, name, description, start_date, end_date, status } = req.body;


        // Validasi input
        if (!project_id || !name) {
            return res.status(400).json({
                success: false,
                message: 'Project and page name are required'
            });
        }

        // Ambil client_id dari project
        const [project] = await db.execute(
            'SELECT id, client_id FROM projects WHERE id = ?',
            [project_id]
        );

        if (project.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Project not found'
            });
        }

        const client_id = project[0].client_id;
        console.log('Client ID from project:', client_id);

        // Insert page dengan client_id
        const [result] = await db.execute(
            `INSERT INTO pages (client_id, project_id, name, description, start_date, end_date, status, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                client_id,                    // Dari project
                project_id,
                name,
                description || null,
                start_date || null,
                end_date || null,
                status || 'planning',
                req.user.id
            ]
        );


        // Log activity (dengan error handling terpisah)
        try {
            await logActivity(
                req.user.id,
                'created_page',
                'page',
                result.insertId,
                null,
                { name, project_id, client_id },
                req.ip
            );
        } catch (logError) {
            console.error('Failed to log activity:', logError);
        }

        res.status(201).json({
            success: true,
            message: 'Page created successfully',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error: ' + error.message
        });
    }
};

// Update page
exports.updatePage = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, start_date, end_date, status } = req.body;

        const [existing] = await db.execute('SELECT * FROM pages WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Page not found' });
        }

        await db.execute(
            `UPDATE pages SET name = ?, description = ?, 
       start_date = ?, end_date = ?, status = ? WHERE id = ?`,
            [name, description, start_date, end_date, status, id]
        );

        await logActivity(req.user.id, 'updated_page', 'page', id, existing[0], { name, status }, req.ip);

        res.json({ success: true, message: 'Page updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
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
