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

// Get global financial stats for admin/manager
exports.getGlobalFinanceStats = async (req, res) => {
    try {
        const [stats] = await db.execute(
            `SELECT 
                COALESCE(SUM(amount), 0) as total_earned,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as total_paid,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as total_pending
             FROM artist_earnings`
        );

        const [payouts] = await db.execute(
            `SELECT COUNT(*) as pending_requests, COALESCE(SUM(amount), 0) as pending_amount 
             FROM withdrawals 
             WHERE status = 'pending'`
        );

        res.json({
            success: true,
            data: {
                ...stats[0],
                pending_requests: payouts[0].pending_requests,
                pending_requests_amount: payouts[0].pending_amount
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
