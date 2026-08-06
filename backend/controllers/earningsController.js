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

// Get spend analytics (weekly, monthly, yearly) for manager/admin dashboard
exports.getSpendAnalytics = async (req, res) => {
    try {
        const period = ['weekly', 'monthly', 'yearly'].includes(req.query.period)
            ? req.query.period
            : 'monthly';

        let dateFormatExpr = '';
        let numIntervals = 12;

        if (period === 'weekly') {
            dateFormatExpr = "DATE_FORMAT(DATE_SUB(created_at, INTERVAL WEEKDAY(created_at) DAY), '%Y-%m-%d')";
            numIntervals = 12;
        } else if (period === 'yearly') {
            dateFormatExpr = "DATE_FORMAT(created_at, '%Y')";
            numIntervals = 5;
        } else {
            dateFormatExpr = "DATE_FORMAT(created_at, '%Y-%m')";
            numIntervals = 12;
        }

        const [rows] = await db.execute(
            `SELECT 
                ${dateFormatExpr} as period_key,
                COALESCE(SUM(amount), 0) as total_spend,
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as paid_spend,
                COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_spend,
                COUNT(*) as task_count
             FROM artist_earnings
             GROUP BY period_key
             ORDER BY period_key ASC`
        );

        const dataMap = new Map();
        for (const r of rows) {
            dataMap.set(String(r.period_key), {
                total_spend: parseFloat(r.total_spend || 0),
                paid_spend: parseFloat(r.paid_spend || 0),
                pending_spend: parseFloat(r.pending_spend || 0),
                task_count: parseInt(r.task_count || 0, 10)
            });
        }

        const chartData = [];
        const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agst', 'Sep', 'Okt', 'Nov', 'Des'];
        const now = new Date();

        if (period === 'weekly') {
            const dayOfWeek = now.getDay();
            const distanceToMon = (dayOfWeek + 6) % 7;
            const currentMon = new Date(now);
            currentMon.setDate(now.getDate() - distanceToMon);
            currentMon.setHours(0, 0, 0, 0);

            for (let i = numIntervals - 1; i >= 0; i--) {
                const weekMon = new Date(currentMon);
                weekMon.setDate(currentMon.getDate() - (i * 7));

                const y = weekMon.getFullYear();
                const m = String(weekMon.getMonth() + 1).padStart(2, '0');
                const d = String(weekMon.getDate()).padStart(2, '0');
                const key = `${y}-${m}-${d}`;

                const monthName = monthNamesIndo[weekMon.getMonth()];
                const label = `${d} ${monthName}`;

                const existing = dataMap.get(key) || { total_spend: 0, paid_spend: 0, pending_spend: 0, task_count: 0 };

                chartData.push({
                    key,
                    label,
                    total_spend: existing.total_spend,
                    paid_spend: existing.paid_spend,
                    pending_spend: existing.pending_spend,
                    task_count: existing.task_count
                });
            }
        } else if (period === 'yearly') {
            const currentYear = now.getFullYear();
            for (let i = numIntervals - 1; i >= 0; i--) {
                const year = String(currentYear - i);
                const existing = dataMap.get(year) || { total_spend: 0, paid_spend: 0, pending_spend: 0, task_count: 0 };
                chartData.push({
                    key: year,
                    label: year,
                    total_spend: existing.total_spend,
                    paid_spend: existing.paid_spend,
                    pending_spend: existing.pending_spend,
                    task_count: existing.task_count
                });
            }
        } else {
            for (let i = numIntervals - 1; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const key = `${y}-${m}`;
                const label = `${monthNamesIndo[d.getMonth()]} ${y}`;

                const existing = dataMap.get(key) || { total_spend: 0, paid_spend: 0, pending_spend: 0, task_count: 0 };

                chartData.push({
                    key,
                    label,
                    total_spend: existing.total_spend,
                    paid_spend: existing.paid_spend,
                    pending_spend: existing.pending_spend,
                    task_count: existing.task_count
                });
            }
        }

        const totalSpendPeriod = chartData.reduce((acc, curr) => acc + curr.total_spend, 0);
        const paidSpendPeriod = chartData.reduce((acc, curr) => acc + curr.paid_spend, 0);
        const pendingSpendPeriod = chartData.reduce((acc, curr) => acc + curr.pending_spend, 0);
        const totalTasksPeriod = chartData.reduce((acc, curr) => acc + curr.task_count, 0);
        const averageSpend = chartData.length > 0 ? Math.round(totalSpendPeriod / chartData.length) : 0;

        res.json({
            success: true,
            data: {
                period,
                chartData,
                summary: {
                    total_spend: totalSpendPeriod,
                    paid_spend: paidSpendPeriod,
                    pending_spend: pendingSpendPeriod,
                    total_tasks: totalTasksPeriod,
                    average_spend: averageSpend
                }
            }
        });
    } catch (error) {
        console.error('Error fetching spend analytics:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


