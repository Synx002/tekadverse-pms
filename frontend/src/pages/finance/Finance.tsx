import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { earningsApi } from '../../api/earnings.api';
import { withdrawalsApi, type Withdrawal } from '../../api/withdrawals.api';
import { toast } from 'sonner';
import { Banknote, TrendingUp, Wallet, History, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle, Building2 } from 'lucide-react';
import { format } from 'date-fns';

export const Finance = () => {
    const { user } = useAuthStore();
    const [earnings, setEarnings] = useState<{ total_earned: number; total_paid: number; total_pending: number } | null>(null);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    useEffect(() => {
        loadFinanceData();
    }, []);

    const loadFinanceData = async () => {
        try {
            setLoading(true);
            if (user?.role === 'artist') {
                const [earningsRes, withdrawalsRes] = await Promise.all([
                    earningsApi.getMyEarnings(),
                    withdrawalsApi.getMyWithdrawals()
                ]);
                if (earningsRes.data) setEarnings(earningsRes.data);
                setWithdrawals(withdrawalsRes.data || []);
            } else {
                const withdrawalsRes = await withdrawalsApi.getAll();
                setWithdrawals(withdrawalsRes.data || []);
                // Managers might want to see global payouts summary
                const payoutsRes = await earningsApi.getPayouts();
                setEarnings({
                    total_earned: 0, // Not applicable globally in this simple view
                    total_paid: 0,
                    total_pending: payoutsRes.data?.total_to_pay || 0
                });
            }
        } catch (error) {
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(withdrawAmount);
        if (!amount || amount <= 0) {
            return toast.error('Please enter a valid amount');
        }

        if (amount > (earnings?.total_pending || 0)) {
            return toast.error('Withdrawal amount exceeds pending balance');
        }

        if (!user?.bank_account_number) {
            return toast.error('Please complete your bank information in your profile first');
        }

        try {
            setRequesting(true);
            await withdrawalsApi.request(amount);
            toast.success('Withdrawal request submitted');
            setWithdrawAmount('');
            loadFinanceData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit request');
        } finally {
            setRequesting(false);
        }
    };

    const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
        const note = status === 'rejected' ? window.prompt('Reason for rejection:') : null;
        if (status === 'rejected' && note === null) return;

        try {
            await withdrawalsApi.updateStatus(id, status, note || undefined);
            toast.success(`Request ${status}`);
            loadFinanceData();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} /> Pending</span>;
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 size={12} /> Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} /> Rejected</span>;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Finance & Payments</h1>
                <p className="text-gray-500 mt-2">Manage your earnings, withdrawals, and financial history</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg shadow-blue-100 relative overflow-hidden">
                    <Banknote className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 text-white/10 -rotate-12" />
                    <p className="text-blue-100 text-sm font-medium">Total Earned</p>
                    <h2 className="text-3xl font-bold mt-1">Rp {earnings?.total_earned.toLocaleString('id-ID')}</h2>
                    <div className="mt-4 flex items-center gap-2 text-blue-100 text-xs">
                        <TrendingUp size={14} />
                        Lifetime gross earnings
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <Wallet className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 text-gray-50 -rotate-12" />
                    <p className="text-gray-500 text-sm font-medium">Pending Balance</p>
                    <h2 className="text-3xl font-bold mt-1 text-gray-900">Rp {earnings?.total_pending.toLocaleString('id-ID')}</h2>
                    <div className="mt-4 flex items-center gap-2 text-orange-600 text-xs font-medium">
                        <Clock size={14} />
                        {user?.role === 'artist' ? 'Available to withdraw' : 'To be paid to artists'}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <CheckCircle2 className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 text-gray-50 -rotate-12" />
                    <p className="text-gray-500 text-sm font-medium">Already Paid</p>
                    <h2 className="text-3xl font-bold mt-1 text-gray-900">Rp {earnings?.total_paid.toLocaleString('id-ID')}</h2>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-medium">
                        <History size={14} />
                        Successfully transferred
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Side: Forms/Controls */}
                <div className="lg:col-span-1 space-y-6">
                    {user?.role === 'artist' && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-6">
                                <ArrowUpRight className="text-blue-600" />
                                Request Withdrawal
                            </h3>
                            <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-gray-700">Amount (IDR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
                                        <input
                                            type="number"
                                            required
                                            min="10000"
                                            step="1000"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            placeholder="Min. 50.000"
                                            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500">Available: Rp {earnings?.total_pending.toLocaleString('id-ID')}</p>
                                </div>

                                {!user.bank_account_number ? (
                                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-xs text-red-700">
                                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                        <span>Please set up your bank account in Profile first.</span>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex flex-col gap-1 text-[10px] text-blue-800">
                                        <div className="flex items-center gap-1 font-bold">
                                            <Building2 size={12} />
                                            Target Account:
                                        </div>
                                        <div>{user.bank_name} - {user.bank_account_number}</div>
                                        <div className="font-medium">a/n {user.bank_account_holder}</div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={requesting || !user.bank_account_number || (earnings?.total_pending || 0) < 50000}
                                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                >
                                    {requesting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    Submit Request
                                </button>
                                <p className="text-[9px] text-gray-400 text-center uppercase tracking-widest font-bold">Processed within 24-48 hours</p>
                            </form>
                        </div>
                    )}

                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                        <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                            <CheckCircle2 size={16} />
                            Payment Guidelines
                        </h4>
                        <ul className="mt-4 space-y-3">
                            {[
                                'Withdrawals are processed during work days.',
                                'Minimum withdrawal amount is Rp 50.000.',
                                'Ensure your bank details are correct before requesting.',
                                'Failed transfers will be refunded to your pending balance.'
                            ].map((text, i) => (
                                <li key={i} className="flex gap-2 text-xs text-emerald-700">
                                    <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Side: History Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <History className="text-gray-400" />
                                {user?.role === 'artist' ? 'Withdrawal History' : 'Payment Requests'}
                            </h3>
                            <button onClick={loadFinanceData} className="text-xs text-blue-600 hover:underline">Refresh</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        {user?.role !== 'artist' && <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Artist</th>}
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Bank Info</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                        {user?.role !== 'artist' && <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {withdrawals.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No requests found</td>
                                        </tr>
                                    ) : (
                                        withdrawals.map((w) => (
                                            <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                                                {user?.role !== 'artist' && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-medium text-gray-900">{w.artist_name}</div>
                                                        <div className="text-[10px] text-gray-500">{w.artist_email}</div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">
                                                    Rp {parseFloat(w.amount.toString()).toLocaleString('id-ID')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(w.status)}
                                                    {w.admin_note && (
                                                        <div className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={w.admin_note}>
                                                            Note: {w.admin_note}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[10px] font-medium text-gray-700">{w.bank_info?.bank_name}</div>
                                                    <div className="text-[10px] text-gray-500 font-mono">{w.bank_info?.bank_account_number}</div>
                                                    <div className="text-[10px] text-gray-400">a/n {w.bank_info?.bank_account_holder}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                    {format(new Date(w.created_at), 'dd MMM yyyy')}
                                                </td>
                                                {user?.role !== 'artist' && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        {w.status === 'pending' ? (
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleUpdateStatus(w.id, 'approved')}
                                                                    className="p-1 px-2.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold hover:bg-emerald-200"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(w.id, 'rejected')}
                                                                    className="p-1 px-2.5 bg-red-100 text-red-700 rounded text-[10px] font-bold hover:bg-red-200"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] text-gray-400 italic">No actions</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
