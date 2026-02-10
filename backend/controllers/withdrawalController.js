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
    let connection;
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
            return res.status(400).json({ success: false, message: 'Withdrawal request already processed' });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            if (status === 'approved') {
                // VALIDASI: Cek saldo pending artis saat ini
                const [currentEarnings] = await connection.execute(
                    "SELECT COALESCE(SUM(amount), 0) as current_pending FROM artist_earnings WHERE artist_id = ? AND status = 'pending'",
                    [withdrawal.artist_id]
                );

                const currentPending = parseFloat(currentEarnings[0].current_pending);
                const requestedAmount = parseFloat(withdrawal.amount);

                console.log('Current pending balance:', currentPending);
                console.log('Requested withdrawal:', requestedAmount);

                if (currentPending < requestedAmount) {
                    throw new Error(`Insufficient balance. Artist has Rp ${currentPending.toLocaleString('id-ID')} but requested Rp ${requestedAmount.toLocaleString('id-ID')}`);
                }

                // Mark artist_earnings as paid
                let remainingToMark = Math.round(requestedAmount);

                const [earnings] = await connection.execute(
                    "SELECT id, amount, artist_id, task_id FROM artist_earnings WHERE artist_id = ? AND status = 'pending' ORDER BY created_at ASC",
                    [withdrawal.artist_id]
                );

                for (const earning of earnings) {
                    if (remainingToMark <= 0) break;

                    const earningAmount = Math.round(parseFloat(earning.amount));

                    if (earningAmount <= remainingToMark) {
                        // This earning record is fully covered by the withdrawal
                        await connection.execute(
                            "UPDATE artist_earnings SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?",
                            [earning.id]
                        );
                        remainingToMark -= earningAmount;
                    } else {
                        // This earning record is larger than what remains to be paid, so split it
                        const newPendingAmount = earningAmount - remainingToMark;

                        // Update original to the remaining pending amount
                        await connection.execute(
                            "UPDATE artist_earnings SET amount = ? WHERE id = ?",
                            [newPendingAmount, earning.id]
                        );

                        // Insert new record for the paid portion
                        await connection.execute(
                            "INSERT INTO artist_earnings (artist_id, task_id, amount, status, paid_at) VALUES (?, ?, ?, 'paid', CURRENT_TIMESTAMP)",
                            [earning.artist_id, earning.task_id, remainingToMark]
                        );

                        remainingToMark = 0;
                    }
                }

                // Verifikasi semua amount sudah di-mark
                if (remainingToMark > 0) {
                    throw new Error(`Failed to mark all earnings. Remaining: Rp ${remainingToMark.toLocaleString('id-ID')}`);
                }
            }

            // Update withdrawal status (untuk approved dan rejected)
            await connection.execute(
                "UPDATE withdrawals SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                [status, admin_note || null, id]
            );

            await connection.commit();
        } catch (err) {
            if (connection) await connection.rollback();
            throw err;
        } finally {
            if (connection) connection.release();
        }

        // Post-transaction notifications and logging (non-fatal)
        try {
            await createNotification(
                withdrawal.artist_id,
                'withdrawal_update',
                `Your withdrawal request of Rp ${Number(withdrawal.amount).toLocaleString('id-ID')} has been ${status}`,
                'finance',
                id
            );
            await logActivity(req.user.id, `withdrawal_${status}`, 'withdrawal', id, withdrawal, { status, admin_note }, req.ip);
        } catch (postErr) {
            console.error('Post-transaction tasks failed:', postErr);
        }

        return res.json({
            success: true,
            message: `Withdrawal request ${status}`,
            data: {
                withdrawal_id: id,
                status: status,
                amount: withdrawal.amount
            }
        });
    } catch (error) {
        console.error('Withdrawal update error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Server error',
            details: error.sqlMessage || error.code
        });
    }
};
