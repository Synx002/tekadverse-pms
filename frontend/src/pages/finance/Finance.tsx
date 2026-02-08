import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { earningsApi, type PayoutItem, type GlobalFinanceStats } from '../../api/earnings.api';
import { withdrawalsApi, type Withdrawal } from '../../api/withdrawals.api';
import { toast } from 'sonner';
import { Banknote, TrendingUp, Wallet, History, ArrowUpRight, Clock, CheckCircle2, XCircle, AlertCircle, Building2, Users, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton, FinanceCardSkeleton } from '../../components/ui/Skeleton';

export const Finance = () => {
    const { user } = useAuthStore();
    const [earnings, setEarnings] = useState<{ total_earned: number; total_paid: number; total_pending: number } | null>(null);
    const [globalStats, setGlobalStats] = useState<GlobalFinanceStats | null>(null);
    const [payouts, setPayouts] = useState<PayoutItem[]>([]);
    const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const isArtist = user?.role === 'artist';

    useEffect(() => {
        loadFinanceData();
    }, []);

    const loadFinanceData = async () => {
        try {
            setLoading(true);
            if (isArtist) {
                const [earningsRes, withdrawalsRes] = await Promise.all([
                    earningsApi.getMyEarnings(),
                    withdrawalsApi.getMyWithdrawals()
                ]);
                if (earningsRes.data) setEarnings(earningsRes.data);
                setWithdrawals(withdrawalsRes.data || []);
            } else {
                const [withdrawalsRes, payoutsRes, statsRes] = await Promise.all([
                    withdrawalsApi.getAll(),
                    earningsApi.getPayouts(),
                    earningsApi.getGlobalStats()
                ]);
                setWithdrawals(withdrawalsRes.data || []);
                setPayouts(payoutsRes.data?.payouts || []);
                setGlobalStats(statsRes.data ?? null);
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

        if (amount < 50000) {
            return toast.error('Minimum withdrawal is Rp 50,000');
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

    const formatShortIDR = (amount: number | string | undefined) => {
        const value = Number(amount || 0);
        return `Rp ${value.toLocaleString('id-ID')}`;
    };

    if (loading) {
        return (
            <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <Skeleton className="h-8 w-40 rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(isArtist ? 3 : 4)].map((_, i) => (
                        <FinanceCardSkeleton key={i} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:col-span-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                        <Skeleton className="h-96 w-full rounded-2xl" />
                        <Skeleton className="h-48 w-full rounded-2xl" />
                    </div>
                    <div className="lg:col-span-2">
                        <Skeleton className="h-[600px] w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    const renderArtistView = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                    <Banknote className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 text-white/10 -rotate-12" />
                    <p className="text-blue-100 text-sm font-medium tracking-wider">Total Earned</p>
                    <h2 className="text-3xl font-bold mt-1">{formatShortIDR(earnings?.total_earned)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-blue-100 text-xs">
                        <TrendingUp size={14} /> Lifetime gross earnings
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <Wallet className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 text-gray-50 -rotate-12" />
                    <p className="text-gray-500 text-sm font-medium tracking-wider">Available Balance</p>
                    <h2 className="text-3xl font-bold mt-1 text-gray-900 ">{formatShortIDR(earnings?.total_pending)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-orange-600 text-xs font-medium">
                        <Clock size={14} /> Ready to withdraw
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                    <CheckCircle2 className="absolute top-1/2 right-4 -translate-y-1/2 w-24 h-24 text-gray-50 -rotate-12" />
                    <p className="text-gray-500 text-sm font-medium tracking-wider">Paid to Bank</p>
                    <h2 className="text-3xl font-bold mt-1 text-gray-900 ">{formatShortIDR(earnings?.total_paid)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-emerald-600 text-xs font-medium">
                        <History size={14} /> Successfully transferred
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className=" text-gray-900 flex items-center gap-2 mb-6">
                            <ArrowUpRight className="text-blue-600" /> Request Withdrawal
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
                                        placeholder="Min. 50,000"
                                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none "
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium">Max Limit: {formatShortIDR(earnings?.total_pending)}</p>
                            </div>

                            {!user?.bank_account_number ? (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-sm text-red-700">
                                    <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                    <span>Please complete your bank account details in your Profile first.</span>
                                </div>
                            ) : (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-xs  text-blue-900 border-b border-blue-100 pb-2">
                                        <Building2 size={14} /> TARGET ACCOUNT
                                    </div>
                                    <div className="text-xs text-blue-800">
                                        <p className=" text-base">{user.bank_name}</p>
                                        <p className=" mt-1">{user.bank_account_number}</p>
                                        <p className="mt-1 opacity-70 italic">a/n {user.bank_account_holder}</p>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={requesting || !user?.bank_account_number || (earnings?.total_pending || 0) < 50000}
                                className="w-full bg-gray-900 text-white py-4 rounded-xl  hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                            >
                                {requesting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowUpRight size={20} />}
                                Withdraw Balance Now
                            </button>
                            <p className="text-[10px] text-gray-400 text-center tracking-widest ">Processed within 1-2 business days</p>
                        </form>
                    </div>

                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                        <h4 className=" text-emerald-900 text-sm flex items-center gap-2 mb-4">
                            <CheckCircle2 size={18} /> Withdrawal Information
                        </h4>
                        <ul className="space-y-3">
                            {[
                                'Withdrawals are processed on business days (Monday-Friday).',
                                'Minimum withdrawal amount is Rp 50,000.',
                                'Make sure your bank account details are correct before withdrawing.',
                                'Balance will be returned if transfer fails.'
                            ].map((text, i) => (
                                <li key={i} className="flex gap-2 text-xs text-emerald-700 leading-relaxed">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className=" text-gray-900 flex items-center gap-2">
                                <History className="text-gray-400" /> Withdrawal History
                            </h3>
                            <button onClick={loadFinanceData} className="text-xs text-blue-600  hover:underline">Refresh</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-white border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-[10px]  text-gray-400 tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-left text-[10px]  text-gray-400 tracking-widest">Status</th>
                                        <th className="px-6 py-4 text-left text-[10px]  text-gray-400 tracking-widest">Account</th>
                                        <th className="px-6 py-4 text-left text-[10px]  text-gray-400 tracking-widest">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {withdrawals.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center text-gray-400 italic">No withdrawal history yet</td>
                                        </tr>
                                    ) : (
                                        withdrawals.map((w) => (
                                            <tr key={w.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap  text-gray-900">
                                                    {formatShortIDR(parseFloat(w.amount.toString()))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(w.status)}
                                                    {w.admin_note && (
                                                        <div className="text-[10px] text-red-500 mt-1.5 bg-red-50 p-1 px-2 rounded border border-red-100 max-w-[150px] truncate" title={w.admin_note}>
                                                            {w.admin_note}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-[10px]  text-gray-700">{w.bank_info?.bank_name}</div>
                                                    <div className="text-[10px] text-gray-500  mt-0.5">{w.bank_info?.bank_account_number}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                    {format(new Date(w.created_at), 'dd MMM yyyy, HH:mm')}
                                                </td>
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

    const renderManagerView = () => (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:border-blue-500 transition-colors">
                    <p className="text-gray-500 text-xs font-medium tracking-widest">Total Earned (System)</p>
                    <h2 className="text-3xl font-bold mt-2 text-gray-900 ">{formatShortIDR(globalStats?.total_earned)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-blue-600 text-[10px] ">
                        <TrendingUp size={14} /> All Artist Work
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden group hover:border-orange-500 transition-colors">
                    <p className="text-orange-600 text-xs font-medium tracking-widest">Unpaid Balance</p>
                    <h2 className="text-3xl font-bold mt-2 text-orange-700 ">{formatShortIDR(globalStats?.total_pending)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-orange-600 text-[10px] ">
                        <Wallet size={14} /> Not Yet Withdrawn By Artists
                    </div>
                </div>

                <div className="bg-red-50 p-6 rounded-2xl border-2 border-red-200 relative overflow-hidden">
                    <p className="text-red-700 text-xs font-medium tracking-widest">Pending Requests</p>
                    <h2 className="text-3xl font-bold mt-2 text-red-800 ">{formatShortIDR(globalStats?.pending_requests_amount)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-red-600 text-[10px]">
                        <Clock size={14} /> {globalStats?.pending_requests} Requests Waiting
                    </div>
                </div>

                <div className="bg-emerald-600 p-6 rounded-2xl shadow-lg shadow-emerald-100 text-white relative overflow-hidden">
                    <p className="text-emerald-100 text-xs font-medium tracking-widest">Total Lifetime Paid</p>
                    <h2 className="text-3xl font-bold mt-2 text-white ">{formatShortIDR(globalStats?.total_paid)}</h2>
                    <div className="mt-4 flex items-center gap-2 text-emerald-100 text-[10px]">
                        <CheckCircle2 size={14} /> Successfully Transferred
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-red-50/50">
                        <h3 className=" text-red-900 flex items-center gap-2">
                            <ArrowDownRight className="text-red-600" /> Withdrawal Requests
                        </h3>
                        <span className="bg-red-200 text-red-900 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                            Action Required
                        </span>
                    </div>
                    <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                        {withdrawals.filter(w => w.status === 'pending').length === 0 ? (
                            <div className="p-12 text-center text-gray-400 italic">No new withdrawal requests</div>
                        ) : (
                            withdrawals.filter(w => w.status === 'pending').map((w) => (
                                <div key={w.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Artist</p>
                                            <p className=" text-gray-900">{w.artist_name}</p>
                                            <p className="text-xs text-gray-500">{w.artist_email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Amount</p>
                                            <p className="text-xl font-black text-blue-700">{formatShortIDR(parseFloat(w.amount.toString()))}</p>
                                        </div>
                                    </div>
                                    <div className="bg-gray-100 rounded-xl p-4 flex gap-4 items-center mb-4">
                                        <Building2 className="text-gray-400" size={20} />
                                        <div className="text-xs">
                                            <p className=" text-gray-800">{w.bank_info?.bank_name}</p>
                                            <p className=" text-gray-600 my-0.5">{w.bank_info?.bank_account_number}</p>
                                            <p className="opacity-70 italic text-gray-500">a/n {w.bank_info?.bank_account_holder}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleUpdateStatus(w.id, 'approved')}
                                            className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg  text-xs hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 size={16} /> Mark as Paid
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(w.id, 'rejected')}
                                            className="px-6 border-2 border-red-200 text-red-600 py-2.5 rounded-lg  text-xs hover:bg-red-50 active:scale-95 transition-all"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <h3 className=" text-gray-800 flex items-center gap-2">
                                <Users className="text-gray-400" /> Artist Balances
                            </h3>
                            <span className="text-[10px]  text-gray-400 tracking-widest">Sorted by highest</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-[10px]  text-gray-500 uppercase">Artist</th>
                                        <th className="px-6 py-3 text-right text-[10px]  text-gray-500 uppercase">Pending Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {payouts.map((p) => (
                                        <tr key={p.artist_id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className=" text-gray-800 text-sm">{p.artist_name}</div>
                                                <div className="text-[10px] text-gray-500  italic">{p.artist_email}</div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className=" text-orange-600">{formatShortIDR(p.total_pending)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {payouts.length === 0 && (
                                        <tr><td colSpan={2} className="p-8 text-center text-gray-400 italic">All artists have been paid in full</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                            <p className="text-[10px] text-gray-400 font-bold tracking-widest leading-relaxed">
                                TOTAL UNPAID: <span className="text-orange-600 ml-1">{formatShortIDR(payouts.reduce((s, p) => s + Number(p.total_pending), 0))}</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                <History className="text-gray-400" /> Recent History
                            </h3>
                            <button onClick={loadFinanceData} className="text-xs text-blue-600 hover:underline">See full log</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <tbody className="divide-y divide-gray-50">
                                    {withdrawals.filter(w => w.status !== 'pending').slice(0, 5).map((w) => (
                                        <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${w.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                        {w.status === 'approved' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800">{formatShortIDR(parseFloat(w.amount.toString()))}</p>
                                                        <p className="text-[10px] text-gray-400 capitalize">{w.artist_name} • {w.status}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-[10px] text-gray-400">{format(new Date(w.created_at), 'dd MMM')}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        Finance
                    </h1>
                    <p className="text-gray-500 mt-2 font-regular">
                        {isArtist
                            ? "Track your earnings and request withdrawals to your bank account"
                            : "Manage project finances and verify artist withdrawal requests"}
                    </p>
                </div>
                <div className="text-[10px] font-black text-gray-400 tracking-[0.2em] bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                    Status: {user?.role.toUpperCase()} ACCOUNT
                </div>
            </div>

            {isArtist ? renderArtistView() : renderManagerView()}
        </div>
    );
};