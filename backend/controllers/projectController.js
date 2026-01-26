const db = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const { client_id, status, search } = req.query;

        let query = `
      SELECT p.*, c.name as client_name, c.logo as client_logo,
             u.name as created_by_name,
             COUNT(t.id) as task_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE 1=1
    `;
        const params = [];

        if (client_id) {
            query += ' AND p.client_id = ?';
            params.push(client_id);
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
            return res.status(404).json({ message: 'Project not found' });
        }

        // Get tasks
        const [tasks] = await db.execute(
            `SELECT t.*, u.name as assigned_to_name, u.profile_picture
       FROM tasks t
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.project_id = ?
       ORDER BY t.created_at DESC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...projects[0],
                tasks
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
        const { client_id, name, description, start_date, end_date, status } = req.body;

        if (!client_id || !name) {
            return res.status(400).json({ message: 'Client and project name are required' });
        }

        const [result] = await db.execute(
            `INSERT INTO projects (client_id, name, description, start_date, end_date, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [client_id, name, description, start_date, end_date, status || 'planning', req.user.id]
        );

        await logActivity(req.user.id, 'created_project', 'project', result.insertId, null, { name, client_id }, req.ip);

        res.status(201).json({
            message: 'Project created successfully',
            projectId: result.insertId
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
        const { client_id, name, description, start_date, end_date, status } = req.body;

        const [existing] = await db.execute('SELECT * FROM projects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await db.execute(
            `UPDATE projects SET client_id = ?, name = ?, description = ?, 
       start_date = ?, end_date = ?, status = ? WHERE id = ?`,
            [client_id, name, description, start_date, end_date, status, id]
        );

        await logActivity(req.user.id, 'updated_project', 'project', id, existing[0], { name, status }, req.ip);

        res.json({ message: 'Project updated successfully' });
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

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;