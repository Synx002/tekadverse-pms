import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Calendar, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { earningsApi, type SpendAnalyticsResponse } from '../../api/earnings.api';

type PeriodType = 'weekly' | 'monthly' | 'yearly';

const formatIDR = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatShortIDR = (value: number) => {
    if (value >= 1_000_000_000) {
        return `Rp ${(value / 1_000_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000_000) {
        return `Rp ${(value / 1_000_000).toFixed(1)}Jt`;
    }
    if (value >= 1_000) {
        return `Rp ${(value / 1_000).toFixed(0)}Rb`;
    }
    return `Rp ${value}`;
};

export const SpendChart = () => {
    const [period, setPeriod] = useState<PeriodType>('monthly');
    const [data, setData] = useState<SpendAnalyticsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await earningsApi.getSpendAnalytics(period);
                if (res.success && res.data) {
                    setData(res.data);
                }
            } catch (err: any) {
                console.error('Failed to load spend analytics:', err);
                setError('Gagal memuat data grafik pengeluaran');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [period]);

    const periodOptions: { label: string; value: PeriodType }[] = [
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
    ];

    const summary = data?.summary;
    const chartData = data?.chartData || [];

    // Custom Tooltip for Recharts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0]?.payload;
            return (
                <div className="bg-white/95 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 text-xs space-y-1.5 min-w-[180px]">
                    <p className="font-semibold text-gray-800 border-b border-gray-100 pb-1 flex items-center justify-between">
                        <span>{label}</span>
                        {item?.task_count !== undefined && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-normal">
                                {item.task_count} task
                            </span>
                        )}
                    </p>
                    <div className="space-y-1">
                        <div className="flex justify-between items-center text-indigo-600 font-medium">
                            <span>Total Spend:</span>
                            <span>{formatIDR(item?.total_spend || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600">
                            <span>Paid (Terbayar):</span>
                            <span>{formatIDR(item?.paid_spend || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-600">
                            <span>Pending (Tertunda):</span>
                            <span>{formatIDR(item?.pending_spend || 0)}</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
            {/* Header & Period Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" />
                        Total Spend Analytics
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Ringkasan total pengeluaran biaya task per periode ({period})
                    </p>
                </div>

                {/* Switcher Buttons */}
                <div className="inline-flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto border border-gray-200">
                    {periodOptions.map((opt) => (
                        <button
                            key={opt.value}
                            onClick={() => setPeriod(opt.value)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 cursor-pointer ${
                                period === opt.value
                                    ? 'bg-white text-indigo-600 shadow-sm border border-gray-200/60'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 p-3.5 rounded-xl border border-indigo-100/80">
                    <div className="flex items-center gap-2 text-indigo-700 text-xs font-medium mb-1">
                        <DollarSign size={14} /> Total Spend
                    </div>
                    <p className="text-base sm:text-lg font-bold text-indigo-950">
                        {loading ? '...' : formatShortIDR(summary?.total_spend || 0)}
                    </p>
                    <p className="text-[10px] text-indigo-600 mt-0.5">
                        {summary?.total_tasks || 0} task selesai
                    </p>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 p-3.5 rounded-xl border border-emerald-100/80">
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium mb-1">
                        <CheckCircle2 size={14} /> Terbayar (Paid)
                    </div>
                    <p className="text-base sm:text-lg font-bold text-emerald-950">
                        {loading ? '...' : formatShortIDR(summary?.paid_spend || 0)}
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-0.5">Sudah dicairkan</p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-yellow-50/50 p-3.5 rounded-xl border border-amber-100/80">
                    <div className="flex items-center gap-2 text-amber-700 text-xs font-medium mb-1">
                        <Clock size={14} /> Pending
                    </div>
                    <p className="text-base sm:text-lg font-bold text-amber-950">
                        {loading ? '...' : formatShortIDR(summary?.pending_spend || 0)}
                    </p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Belum dicairkan</p>
                </div>

                <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-3.5 rounded-xl border border-gray-200/80">
                    <div className="flex items-center gap-2 text-gray-700 text-xs font-medium mb-1">
                        <Calendar size={14} /> Rerata / Periode
                    </div>
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                        {loading ? '...' : formatShortIDR(summary?.average_spend || 0)}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5">Rata-rata per bar</p>
                </div>
            </div>

            {/* Chart Area */}
            <div className="h-[320px] w-full pt-2">
                {loading ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : error ? (
                    <div className="h-full flex items-center justify-center text-sm text-red-500">
                        {error}
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                        Belum ada data pengeluaran pada periode ini.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={{ stroke: '#e2e8f0' }}
                                tickLine={false}
                                dy={8}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#64748b' }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(val) => formatShortIDR(val)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                verticalAlign="top"
                                align="right"
                                wrapperStyle={{ paddingBottom: '15px', fontSize: '12px' }}
                            />
                            <Bar
                                dataKey="paid_spend"
                                name="Terbayar (Paid)"
                                stackId="a"
                                fill="#10b981"
                                radius={[0, 0, 0, 0]}
                            />
                            <Bar
                                dataKey="pending_spend"
                                name="Tertunda (Pending)"
                                stackId="a"
                                fill="#f59e0b"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
};
