const db = require('../config/database');
const { logActivity } = require('../utils/logger');
const { createNotification } = require('./notificationController');

// Artist requests a withdrawal
exports.requestWithdrawal = async (req, res) => {
    try {
        const artist_id = req.user.id;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        // Check if artist already has a pending withdrawal
        const [pending] = await db.execute(
            "SELECT id FROM withdrawals WHERE artist_id = ? AND status = 'pending'",
            [artist_id]
        );

        if (pending.length > 0) {
            return res.status(400).json({ success: false, message: 'You already have a pending withdrawal request' });
        }

        // Check if artist has enough pending balance
        const [earnings] = await db.execute(
            "SELECT COALESCE(SUM(amount), 0) as pending_balance FROM artist_earnings WHERE artist_id = ? AND status = 'pending'",
            [artist_id]
        );

        const pendingBalance = parseFloat(earnings[0].pending_balance);
        if (amount > pendingBalance) {
            return res.status(400).json({ success: false, message: 'Insufficient pending balance' });
        }

        // Get artist bank info for snapshot
        const [user] = await db.execute(
            "SELECT bank_name, bank_account_number, bank_account_holder FROM users WHERE id = ?",
            [artist_id]
        );

        if (!user[0].bank_account_number) {
            return res.status(400).json({ success: false, message: 'Please complete your bank information first' });
        }

        const bank_info = JSON.stringify(user[0]);

        // Create withdrawal request
        const [result] = await db.execute(
            "INSERT INTO withdrawals (artist_id, amount, bank_info, status) VALUES (?, ?, ?, 'pending')",
            [artist_id, amount, bank_info]
        );

        // Notify Managers and Admins
        const [staff] = await db.execute("SELECT id FROM users WHERE role IN ('manager', 'admin')");
        for (const s of staff) {
            await createNotification(
                s.id,
                'withdrawal_request',
                `Artist ${req.user.name} requested withdrawal of Rp ${amount.toLocaleString('id-ID')}`,
                'finance',
                result.insertId
            );
        }

        await logActivity(artist_id, 'requested_withdrawal', 'withdrawal', result.insertId, null, { amount }, req.ip);

        res.status(201).json({ success: true, message: 'Withdrawal request submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Manager/Admin gets all withdrawals
exports.getAllWithdrawals = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT w.*, u.name as artist_name, u.email as artist_email 
            FROM withdrawals w
            JOIN users u ON w.artist_id = u.id
            ORDER BY w.created_at DESC
        `);

        // Parse bank_info if it's a string
        const formattedRows = rows.map(row => ({
            ...row,
            bank_info: typeof row.bank_info === 'string' ? JSON.parse(row.bank_info) : row.bank_info
        }));

        res.json({ success: true, data: formattedRows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Artist gets their own withdrawals
exports.getMyWithdrawals = async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM withdrawals WHERE artist_id = ? ORDER BY created_at DESC",
            [req.user.id]
        );

        const formattedRows = rows.map(row => ({
            ...row,
            bank_info: typeof row.bank_info === 'string' ? JSON.parse(row.bank_info) : row.bank_info
        }));

        res.json({ success: true, data: formattedRows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// Manager/Admin updates withdrawal status (Approve/Reject)
exports.updateWithdrawalStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_note } = req.body;

        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const [existing] = await db.execute("SELECT * FROM withdrawals WHERE id = ?", [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
        }

        const withdrawal = existing[0];
        if (withdrawal.status !== 'pending' && status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Order already processed' });
        }

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update withdrawal status
            await connection.execute(
                "UPDATE withdrawals SET status = ?, admin_note = ? WHERE id = ?",
                [status, admin_note || null, id]
            );

            if (status === 'approved') {
                // Mark artist_earnings as paid
                // We mark enough pending earnings to cover the withdrawal amount
                let remainingToMark = parseFloat(withdrawal.amount);

                const [earnings] = await connection.execute(
                    "SELECT id, amount FROM artist_earnings WHERE artist_id = ? AND status = 'pending' ORDER BY created_at ASC",
                    [withdrawal.artist_id]
                );

                for (const earning of earnings) {
                    if (remainingToMark <= 0) break;

                    const earningAmount = parseFloat(earning.amount);

                    // If the earning amount is exactly what's needed or less, mark it all as paid
                    if (earningAmount <= remainingToMark) {
                        await connection.execute(
                            "UPDATE artist_earnings SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?",
                            [earning.id]
                        );
                        remainingToMark -= earningAmount;
                    } else {
                        // If a single earning record is LARGER than the remaining withdrawal amount,
                        // we need to split it: create a new 'paid' record and update the original to reduce its amount

                        // Create a new 'paid' record for the withdrawn portion
                        await connection.execute(
                            `INSERT INTO artist_earnings (artist_id, task_id, amount, status, paid_at, created_at) 
                             SELECT artist_id, task_id, ?, 'paid', CURRENT_TIMESTAMP, created_at 
                             FROM artist_earnings WHERE id = ?`,
                            [remainingToMark, earning.id]
                        );

                        // Update the original record to reduce its amount (keep it as 'pending')
                        const newAmount = earningAmount - remainingToMark;
                        await connection.execute(
                            "UPDATE artist_earnings SET amount = ? WHERE id = ?",
                            [newAmount, earning.id]
                        );

                        remainingToMark = 0;
                    }
                }
            }

            await connection.commit();

            // Notify artist
            await createNotification(
                withdrawal.artist_id,
                'withdrawal_update',
                `Your withdrawal request of Rp ${parseFloat(withdrawal.amount).toLocaleString('id-ID')} has been ${status}`,
                'finance',
                id
            );

            await logActivity(req.user.id, `withdrawal_${status}`, 'withdrawal', id, withdrawal, { status, admin_note }, req.ip);

            res.json({ success: true, message: `Withdrawal request ${status}` });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
