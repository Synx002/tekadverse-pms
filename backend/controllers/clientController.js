const db = require('../config/database');
const { logActivity } = require('../utils/logger');

// Get all clients
exports.getAllClients = async (req, res) => {
    try {
        const { search, is_active } = req.query;

        let query = `
      SELECT c.*, u.name as created_by_name 
      FROM clients c 
      LEFT JOIN users u ON c.created_by = u.id 
      WHERE 1=1
    `;
        const params = [];

        if (is_active !== undefined) {
            query += ' AND c.is_active = ?';
            params.push(is_active);
        }

        if (search) {
            query += ' AND (c.name LIKE ? OR c.company LIKE ? OR c.email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY c.created_at DESC';

        const [clients] = await db.execute(query, params);
        res.json({ success: true, data: clients });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get client by ID
exports.getClientById = async (req, res) => {
    try {
        const { id } = req.params;

        const [clients] = await db.execute(
            `SELECT c.*, u.name as created_by_name 
       FROM clients c 
       LEFT JOIN users u ON c.created_by = u.id 
       WHERE c.id = ?`,
            [id]
        );

        if (clients.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        // Get projects count
        const [projects] = await db.execute(
            'SELECT COUNT(*) as project_count FROM projects WHERE client_id = ?',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...clients[0],
                project_count: projects[0].project_count
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Create client
exports.createClient = async (req, res) => {
    try {
        const { name, email, phone, company, address, description } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Client name is required' });
        }

        const logo = req.file ? req.file.path.replace(/\\/g, '/') : null;

        const [result] = await db.execute(
            `INSERT INTO clients (name, email, phone, company, logo, address, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, phone, company, logo, address, description, req.user.id]
        );

        await logActivity(req.user.id, 'created_client', 'client', result.insertId, null, { name, company }, req.ip);

        res.status(201).json({
            message: 'Client created successfully',
            clientId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update client
exports.updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, company, address, description, is_active } = req.body;

        const [existing] = await db.execute('SELECT * FROM clients WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        const logo = req.file ? req.file.path.replace(/\\/g, '/') : existing[0].logo;

        await db.execute(
            `UPDATE clients SET name = ?, email = ?, phone = ?, company = ?, logo = ?, 
       address = ?, description = ?, is_active = ? WHERE id = ?`,
            [name, email, phone, company, logo, address, description, is_active, id]
        );

        await logActivity(req.user.id, 'updated_client', 'client', id, existing[0], { name, company }, req.ip);

        res.json({ message: 'Client updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete client
exports.deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.execute('SELECT * FROM clients WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Client not found' });
        }

        await db.execute('DELETE FROM clients WHERE id = ?', [id]);

        await logActivity(req.user.id, 'deleted_client', 'client', id, existing[0], null, req.ip);

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = exports;