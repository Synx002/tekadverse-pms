const db = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all projects for a client
exports.getAllProjects = async (req, res) => {
    try {
        const { client_id, status, search } = req.query;

        let query = `
      SELECT p.*, c.name as client_name, c.logo as client_logo,
             u.name as created_by_name,
             COUNT(pg.id) as pages_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN pages pg ON p.id = pg.project_id
      WHERE 1=1
    `;
        const params = [];

        // Role-based filtering for artist
        if (req.user.role === 'artist') {
            query += ` AND EXISTS (
                SELECT 1 FROM pages pg2
                JOIN tasks t ON pg2.id = t.page_id
                WHERE pg2.project_id = p.id AND t.assigned_to = ?
            )`;
            params.push(req.user.id);
        }

        if (client_id) {
            query += ' AND p.client_id = ?';
            params.push(client_id);
        }

        if (status) {
            query += ' AND p.status = ?';
            params.push(status);
        }

        if (search) {
            query += ' AND (p.name LIKE ? OR c.name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' GROUP BY p.id ORDER BY p.created_at DESC';

        const [projects] = await db.execute(query, params);
        res.json({ success: true, data: projects });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
    try {
        const { id } = req.params;

        const [projects] = await db.execute(
            `SELECT p.*, c.name as client_name, c.company as client_company,
              u.name as created_by_name
       FROM projects p
       LEFT JOIN clients c ON p.client_id = c.id
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
            [id]
        );

        if (projects.length === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        // Check permission for artist
        if (req.user.role === 'artist') {
            const [hasAccess] = await db.execute(
                `SELECT 1 FROM pages pg
                 JOIN tasks t ON pg.id = t.page_id
                 WHERE pg.project_id = ? AND t.assigned_to = ? LIMIT 1`,
                [id, req.user.id]
            );
            if (hasAccess.length === 0) {
                return res.status(403).json({ success: false, message: 'Access denied to this project' });
            }
        }

        // Get pages within the project
        const [pages] = await db.execute(
            `SELECT pg.*, 
                    COUNT(t.id) as tasks_count,
                    SUM(CASE WHEN t.status IN ('done', 'approved') THEN 1 ELSE 0 END) as tasks_completed
             FROM pages pg
             LEFT JOIN tasks t ON pg.id = t.page_id
             WHERE pg.project_id = ?
             GROUP BY pg.id
             ORDER BY pg.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...projects[0],
                pages
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create project
exports.createProject = async (req, res) => {
    try {
        const { client_id, name, status } = req.body;

        if (!client_id || !name) {
            return res.status(400).json({ message: 'Client and project name are required' });
        }

        const [result] = await db.execute(
            `INSERT INTO projects (client_id, name, status, created_by)
       VALUES (?, ?, ?, ?)`,
            [client_id, name, status, req.user.id]
        );

        await logActivity(req.user.id, 'created_project', 'project', result.insertId, null, { name, client_id }, req.ip);

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, status } = req.body;

        const [existing] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await db.execute(
            `UPDATE projects SET name = ?, status = ? WHERE id = ?`,
            [name, status, id]
        );

        await logActivity(req.user.id, 'updated_project', 'project', id, existing[0], { name, status }, req.ip);

        res.json({ success: true, message: 'Project updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete project
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await db.execute('DELETE FROM projects WHERE id = ?', [id]);

        await logActivity(req.user.id, 'deleted_project', 'project', id, existing[0], null, req.ip);

        res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;