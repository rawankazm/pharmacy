import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    TrendUp, TrendDown, ShoppingCart, Package, Receipt, CurrencyDollar,
    WarningCircle, ArrowRight, Storefront, ChartBar, ChartLine,
    ChartPie, ArrowCircleUp, ArrowCircleDown, Scales, Star,
    CalendarBlank, Clock, Trash
} from '@phosphor-icons/react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import AdminGuard from '../components/AdminGuard';
import { getSales, fetchProducts, fetchExpenses } from '../api';
import { Link } from 'react-router-dom';

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#f43f5e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];

const formatCurrency = (n) => Number(n || 0).toLocaleString() + ' د.ع';
const formatShort = (n) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'م';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'ک';
    return String(n);
};

// Custom tooltip for charts
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-3 text-sm">
            <p className="font-bold text-slate-600 dark:text-slate-400 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="font-black" style={{ color: p.color }}>
                    {p.name}: {Number(p.value).toLocaleString()} د.ع
                </p>
            ))}
        </div>
    );
};

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
    <div className="glass-panel rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60 hover-lift">
        <div className="flex items-start justify-between mb-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${color}-100 dark:bg-${color}-900/30`}>
                <Icon size={22} weight="duotone" className={`text-${color}-500`} />
            </div>
            {trend !== undefined && (
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'}`}>
                    {trend >= 0 ? <TrendUp size={12} /> : <TrendDown size={12} />}
                    {Math.abs(trend).toFixed(1)}%
                </span>
            )}
        </div>
        <p className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-tight">{value}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-bold">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
);

const DashboardPage = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [sales, setSales] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('week'); // 'today' | 'week' | 'month'
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetType, setResetType] = useState(null); // 'sales' | 'full'

    const handleReset = (type) => {
        try {
            if (type === 'sales') {
                localStorage.setItem('mockSales', '[]');
                localStorage.setItem('mockOrders', '[]');
                localStorage.setItem('market_returns', '[]');
                toast.success('تۆماری فرۆشتنەکان و عەرەبانەکان بە سەرکەوتوویی سڕانەوە');
            } else if (type === 'full') {
                localStorage.setItem('mockSales', '[]');
                localStorage.setItem('mockOrders', '[]');
                localStorage.setItem('mockExpenses', '[]');
                localStorage.setItem('market_returns', '[]');
                localStorage.setItem('market_discounts', '[]');
                localStorage.setItem('market_suppliers', '[]');
                localStorage.setItem('market_supplier_purchases', '[]');
                localStorage.setItem('mockProducts', '[]');
                localStorage.removeItem('mockProductImages');
                toast.success('داشبۆرد و تەواوی داتاکان بە سەرکەوتوویی سڕانەوە بۆ دۆخی سەرەتایی');
            }
            setShowResetModal(false);
            setResetType(null);
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err) {
            toast.error('هەڵەیەک ڕوویدا لە کاتی سڕینەوەی داتاکان');
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [sRes, eRes, pRes] = await Promise.all([getSales(), fetchExpenses(), fetchProducts()]);
                setSales(sRes.data || []);
                setExpenses(eRes.data || []);
                setProducts(pRes.data || []);
            } catch { }
            setLoading(false);
        };
        load();
    }, []);

    // ── Date helpers ──
    const now = new Date();
    const todayStr = now.toDateString();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // ── Revenue stats ──
    const stats = useMemo(() => {
        const todaySales = sales.filter(s => new Date(s.paid_at || s.created_at).toDateString() === todayStr);
        const monthSales = sales.filter(s => {
            const d = new Date(s.paid_at || s.created_at);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        });
        const todayRev = todaySales.reduce((sum, s) => sum + (Number(s.total) || Number(s.total_amount) || 0), 0);
        const monthRev = monthSales.reduce((sum, s) => sum + (Number(s.total) || Number(s.total_amount) || 0), 0);
        const totalRev = sales.reduce((sum, s) => sum + (Number(s.total) || Number(s.total_amount) || 0), 0);

        const todayExp = expenses.filter(e => new Date(e.created_at).toDateString() === todayStr)
            .reduce((sum, e) => sum + Number(e.amount || 0), 0);
        const monthExp = expenses.filter(e => {
            const d = new Date(e.created_at);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).reduce((sum, e) => sum + Number(e.amount || 0), 0);

        const lowStock = products.filter(p => p.track_stock && (parseInt(p.stock_quantity) || 0) < 10 && (parseInt(p.stock_quantity) || 0) > 0);
        const outStock = products.filter(p => p.track_stock && (parseInt(p.stock_quantity) || 0) <= 0);

        return {
            todayRev, monthRev, totalRev,
            todayExp, monthExp,
            todayProfit: todayRev - todayExp,
            monthProfit: monthRev - monthExp,
            totalOrders: sales.length,
            todayOrders: todaySales.length,
            lowStock, outStock,
        };
    }, [sales, expenses, products, todayStr, thisMonth, thisYear]);

    // ── Area chart: last 30 days revenue ──
    const revenueChartData = useMemo(() => {
        const days = activeTab === 'today' ? 1 : activeTab === 'week' ? 7 : 30;
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toDateString();
            const label = activeTab === 'today'
                ? d.toLocaleTimeString('ckb', { hour: '2-digit', minute: '2-digit' })
                : d.toLocaleDateString('ckb', { month: 'short', day: 'numeric' });
            const rev = sales
                .filter(s => new Date(s.paid_at || s.created_at).toDateString() === key)
                .reduce((sum, s) => sum + (Number(s.total) || Number(s.total_amount) || 0), 0);
            const exp = expenses
                .filter(e => new Date(e.created_at).toDateString() === key)
                .reduce((sum, e) => sum + Number(e.amount || 0), 0);
            result.push({ label, فرۆشتن: rev, خەرجی: exp, قازانج: Math.max(0, rev - exp) });
        }
        return result;
    }, [sales, expenses, activeTab]);

    // ── Top products by sales ──
    const topProducts = useMemo(() => {
        const countMap = {};
        sales.forEach(s => {
            const items = s.items || s.order_items || [];
            items.forEach(item => {
                const name = item.name_ckb || item.product_name || item.name || 'نادیار';
                countMap[name] = (countMap[name] || 0) + (item.quantity || 1);
            });
        });
        return Object.entries(countMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([name, value]) => ({ name, value }));
    }, [sales]);

    // ── Recent sales ──
    const recentSales = useMemo(() =>
        [...sales]
            .sort((a, b) => new Date(b.paid_at || b.created_at) - new Date(a.paid_at || a.created_at))
            .slice(0, 6),
        [sales]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full gap-3 text-slate-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                <span className="font-bold">بارکردن...</span>
            </div>
        );
    }

    return (
        <AdminGuard>
            <div className="space-y-5 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* ── Header ── */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <ChartBar size={22} weight="duotone" className="text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">داشبۆرد</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">ئامارو ڕاپۆرتی گشتی مارکێت</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-left hidden sm:block">
                            <p className="text-xs text-slate-450 font-bold">{new Date().toLocaleDateString('ckb-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                        <button
                            onClick={() => setShowResetModal(true)}
                            className="flex items-center gap-2 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/30 text-rose-600 dark:text-rose-450 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95"
                        >
                            <Trash size={16} weight="duotone" />
                            <span>سڕینەوەی داتا تاقیکارییەکان</span>
                        </button>
                    </div>
                </div>

                {/* ── Stat Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={CurrencyDollar} label="داهاتی ئەمڕۆ" value={formatCurrency(stats.todayRev)} sub={`${stats.todayOrders} فرۆش`} color="emerald" />
                    <StatCard icon={ChartLine} label="داهاتی ئەم مانگە" value={formatCurrency(stats.monthRev)} color="blue" />
                    <StatCard icon={Scales} label="قازانجی ئەم مانگە" value={formatCurrency(stats.monthProfit)} color={stats.monthProfit >= 0 ? 'emerald' : 'red'} />
                    <StatCard icon={ArrowCircleDown} label="خەرجی ئەم مانگە" value={formatCurrency(stats.monthExp)} color="amber" />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={Receipt} label="کۆی فرۆشتنەکان" value={stats.totalOrders.toLocaleString()} color="indigo" />
                    <StatCard icon={Storefront} label="کۆی داهات" value={formatCurrency(stats.totalRev)} color="teal" />
                    <StatCard icon={WarningCircle} label="ستۆکی کورت" value={stats.lowStock.length} sub="بەرهەم ژێر ١٠" color="amber" />
                    <StatCard icon={Package} label="بێ مەوجود" value={stats.outStock.length} sub="بەرهەم تەواو تەواو" color="red" />
                </div>

                {/* ── Revenue Chart ── */}
                <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-black text-slate-800 dark:text-slate-100 text-lg">چارتی داهات و خەرجی</h2>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                            {[['today', 'ئەمڕۆ'], ['week', '٧ ڕۆژ'], ['month', '٣٠ ڕۆژ']].map(([val, lbl]) => (
                                <button
                                    key={val}
                                    onClick={() => setActiveTab(val)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === val ? 'bg-white dark:bg-slate-700 shadow text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={formatShort} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <Tooltip content={<ChartTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 12, fontWeight: 700 }} />
                            <Area type="monotone" dataKey="فرۆشتن" stroke="#10b981" strokeWidth={2.5} fill="url(#gradSales)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                            <Area type="monotone" dataKey="خەرجی" stroke="#f59e0b" strokeWidth={2} fill="url(#gradExp)" dot={false} activeDot={{ r: 4, fill: '#f59e0b' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* ── Bottom Row ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                    {/* Top Products Pie */}
                    <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5">
                        <h2 className="font-black text-slate-800 dark:text-slate-100 mb-4">باشترین بەرهەمەکان</h2>
                        {topProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-300 dark:text-slate-700">
                                <ChartPie size={48} weight="duotone" />
                                <p className="text-sm font-bold">داتای فرۆشتن نییە</p>
                            </div>
                        ) : (
                            <div className="flex gap-4">
                                <ResponsiveContainer width="55%" height={200}>
                                    <PieChart>
                                        <Pie data={topProducts} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                                            {topProducts.map((_, i) => (
                                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => [v + ' دانە', 'فرۆشراو']} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="flex-1 space-y-2 overflow-hidden py-2">
                                    {topProducts.slice(0, 6).map((p, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate flex-1 font-bold">{p.name}</span>
                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Recent Sales */}
                    <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-black text-slate-800 dark:text-slate-100">دوایین فرۆشەکان</h2>
                            <Link to="/sales" className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700">
                                هەموو <ArrowRight size={14} />
                            </Link>
                        </div>
                        <div className="space-y-2">
                            {recentSales.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-300 dark:text-slate-700">
                                    <Receipt size={48} weight="duotone" />
                                    <p className="text-sm font-bold">هیچ فرۆشێک نییە</p>
                                </div>
                            ) : recentSales.map((s, i) => {
                                const total = Number(s.total) || Number(s.total_amount) || 0;
                                const date = new Date(s.paid_at || s.created_at);
                                return (
                                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                            <Receipt size={16} weight="duotone" className="text-emerald-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                                                {s.cashier_name || s.notes || `فرۆش #${String(s.id).slice(-4)}`}
                                            </p>
                                            <p className="text-xs text-slate-400">{date.toLocaleString('ckb')}</p>
                                        </div>
                                        <span className="font-black text-emerald-600 text-sm">{total.toLocaleString()} د.ع</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Stock Alerts ── */}
                {(stats.lowStock.length > 0 || stats.outStock.length > 0) && (
                    <div className="glass-panel rounded-2xl border border-amber-200/60 dark:border-amber-900/40 p-5 bg-amber-50/50 dark:bg-amber-900/10">
                        <h2 className="font-black text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                            <WarningCircle size={20} weight="duotone" /> ئاگادارکردنەوەی ستۆک
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {[...stats.outStock.map(p => ({ ...p, _status: 'empty' })), ...stats.lowStock.map(p => ({ ...p, _status: 'low' }))].slice(0, 8).map(p => (
                                <div key={p.id} className={`flex items-center gap-2 p-2 rounded-xl ${p._status === 'empty' ? 'bg-red-100 dark:bg-red-900/20' : 'bg-amber-100 dark:bg-amber-900/20'}`}>
                                    <span className={`w-2 h-2 rounded-full ${p._status === 'empty' ? 'bg-red-500' : 'bg-amber-500'}`} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold truncate text-slate-700 dark:text-slate-300">{p.name_ckb || p.name}</p>
                                        <p className={`text-xs font-black ${p._status === 'empty' ? 'text-red-600' : 'text-amber-600'}`}>
                                            {p._status === 'empty' ? 'بێ مەوجود' : `${p.stock_quantity} پەڕی`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link to="/warehouse" className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline">
                            چوونەوە بۆ کۆگا <ArrowRight size={13} />
                        </Link>
                    </div>
                )}
                {/* ── Data Reset Modal ── */}
                {showResetModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative" dir="rtl">
                            <h3 className="text-lg font-black text-slate-850 dark:text-white mb-2 flex items-center gap-2">
                                <WarningCircle size={22} className="text-rose-500" />
                                پاککردنەوەی داتای تاقیکاری
                            </h3>
                            <p className="text-xs text-slate-550 dark:text-slate-400 mb-6 leading-relaxed">
                                لێرەدا دەتوانیت داتاکانی فرۆشتن یان تەواوی مارکێتەکە پاک بکەیتەوە بۆ ئەوەی لە سەرەتاوە تاقی بکەیتەوە. ئەم کردارانە ناگەڕێنەوە.
                            </p>

                            <div className="space-y-3 mb-6">
                                {resetType === null ? (
                                    <>
                                        <button
                                            onClick={() => setResetType('sales')}
                                            className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 text-right group transition-all"
                                        >
                                            <div className="text-right">
                                                <p className="text-sm font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-500 transition-colors">سڕینەوەی فرۆشتنەکان و عەرەبانەکان</p>
                                                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">ئامارەکان، فرۆشی ڕۆژانە و عەرەبانەکانی کاشێر پاك دەکاتەوە.</p>
                                            </div>
                                            <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-[-4px] transition-transform" />
                                        </button>

                                        <button
                                            onClick={() => setResetType('full')}
                                            className="w-full flex items-center justify-between p-3.5 bg-rose-50/30 hover:bg-rose-50/70 dark:bg-rose-950/10 dark:hover:bg-rose-950/25 rounded-2xl border border-rose-100/50 dark:border-rose-900/20 text-right group transition-all"
                                        >
                                            <div className="text-right">
                                                <p className="text-sm font-black text-rose-600 dark:text-rose-450 group-hover:text-rose-700 transition-colors">پاککردنەوەی گشتی (فۆرماتی مارکێت)</p>
                                                <p className="text-[11px] text-rose-450 dark:text-rose-500/80 mt-0.5">تەواوی بەرهەمەکان، خەرجییەکان، دابینکەران، داشکاندنەکان و فرۆشتنەکان دەسڕێتەوە.</p>
                                            </div>
                                            <ArrowRight size={18} className="text-rose-450 group-hover:translate-x-[-4px] transition-transform" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/30 rounded-2xl text-center">
                                        <p className="text-sm font-black text-rose-600 dark:text-rose-400 mb-2">
                                            {resetType === 'sales' ? 'دڵنیای لە سڕینەوەی فرۆشتن و عەرەبانەکان؟' : 'دڵنیای لە پاککردنەوەی گشتی مارکێتەکە؟'}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                                            تەواوی داتای پەیوەندیدار دەسڕێتەوە و لاپەڕەکە نوێ دەبێتەوە.
                                        </p>
                                        <div className="flex gap-2.5">
                                            <button
                                                onClick={() => handleReset(resetType)}
                                                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20 transition-all"
                                            >
                                                بەڵێ، بسڕەوە
                                            </button>
                                            <button
                                                onClick={() => setResetType(null)}
                                                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all"
                                            >
                                                پاشگەزبوونەوە
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {resetType === null && (
                                <button
                                    onClick={() => setShowResetModal(false)}
                                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-all"
                                >
                                    داخستن
                                </button>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </AdminGuard>
    );
};

export default DashboardPage;
