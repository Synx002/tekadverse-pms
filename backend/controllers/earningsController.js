const db = require('../config/database');

// Get artist's total earnings (for Artist Dashboard)
exports.getMyEarnings = async (req, res) => {
    try {
        const artistId = req.user.id;

        const [rows] = await db.execute(
            `SELECT 
                COALESCE(SUM(amount), 0) as total_earned,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending
             FROM artist_earnings
             WHERE artist_id = ?`,
            [artistId]
        );

        const result = rows[0] || { total_earned: 0, total_paid: 0, total_pending: 0 };
        res.json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get payouts summary for manager (list of artists with amount to pay)
exports.getPayouts = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                u.id as artist_id,
                u.name as artist_name,
                u.email as artist_email,
                COALESCE(SUM(ae.amount), 0) as total_pending
             FROM users u
             INNER JOIN artist_earnings ae ON ae.artist_id = u.id
             WHERE u.role = 'artist' AND ae.status = 'pending'
             GROUP BY u.id, u.name, u.email
             HAVING total_pending > 0
             ORDER BY total_pending DESC`
        );

        const totalToPay = rows.reduce((sum, r) => sum + parseFloat(r.total_pending || 0), 0);
        res.json({ success: true, data: { payouts: rows, total_to_pay: totalToPay } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get list of pending tasks contributing to artist's own pending balance
exports.getMyPendingTasks = async (req, res) => {
    try {
        const artistId = req.user.id;

        const [rows] = await db.execute(
            `SELECT 
                ae.id as earning_id,
                ae.amount,
                ae.created_at as earned_at,
                t.id as task_id,
                ps.step_name,
                pg.name as page_name,
                p.name as project_name,
                c.name as client_name
             FROM artist_earnings ae
             JOIN tasks t ON ae.task_id = t.id
             JOIN project_steps ps ON t.step_id = ps.id
             JOIN pages pg ON t.page_id = pg.id
             JOIN projects p ON pg.project_id = p.id
             LEFT JOIN clients c ON p.client_id = c.id
             WHERE ae.artist_id = ? AND ae.status = 'pending'
             ORDER BY ae.created_at DESC`,
            [artistId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get list of pending tasks for a specific artist (manager/admin only)
exports.getArtistPendingTasks = async (req, res) => {
    try {
        const { artistId } = req.params;

        const [rows] = await db.execute(
            `SELECT 
                ae.id as earning_id,
                ae.amount,
                ae.created_at as earned_at,
                t.id as task_id,
                ps.step_name,
                pg.name as page_name,
                p.name as project_name,
                c.name as client_name
             FROM artist_earnings ae
             JOIN tasks t ON ae.task_id = t.id
             JOIN project_steps ps ON t.step_id = ps.id
             JOIN pages pg ON t.page_id = pg.id
             JOIN projects p ON pg.project_id = p.id
             LEFT JOIN clients c ON p.client_id = c.id
             WHERE ae.artist_id = ? AND ae.status = 'pending'
             ORDER BY ae.created_at DESC`,
            [artistId]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Get global finance stats (for manager/admin dashboard)
exports.getGlobalStats = async (req, res) => {
    try {
        const [[totals]] = await db.execute(
            `SELECT
                COALESCE(SUM(amount), 0) as total_earned,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending
             FROM artist_earnings`
        );

        const [[pendingReq]] = await db.execute(
            `SELECT 
                COUNT(*) as pending_requests,
                COALESCE(SUM(amount), 0) as pending_requests_amount
             FROM withdrawals WHERE status = 'pending'`
        );

        res.json({
            success: true,
            data: {
                total_earned: totals.total_earned,
                total_paid: totals.total_paid,
                total_pending: totals.total_pending,
                pending_requests: pendingReq.pending_requests,
                pending_requests_amount: pendingReq.pending_requests_amount,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

