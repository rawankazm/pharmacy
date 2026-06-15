import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendUp, Receipt, CalendarBlank, Funnel, ArrowCounterClockwise, ClipboardText, CurrencyDollar } from '@phosphor-icons/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Button from '../components/Button';
import { formatDate, formatTime } from '../utils/dateFormatter';
import AdminGuard from '../components/AdminGuard';
import { getSales, fetchProducts, fetchExpenses } from '../api';

const COLORS = ['#10b981', '#6366f1', '#14b8a6', '#f43f5e', '#ef4444', '#f59e0b', '#3b82f6'];

const SalesPage = () => {
    const { t, i18n } = useTranslation();
    const [allSales, setAllSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [allProducts, setAllProducts] = useState([]);

    // Expenses State
    const [allExpenses, setAllExpenses] = useState([]);
    const [filteredExpenses, setFilteredExpenses] = useState([]);

    // Filters
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Stats
    const [reportStats, setReportStats] = useState({
        today: 0,
        month: 0,
        year: 0,
        custom: 0,
        totalOrders: 0,
        
        todayExpenses: 0,
        monthExpenses: 0,
        yearExpenses: 0,
        customExpenses: 0
    });

    useEffect(() => {
        // Load Sales and Expenses
        const loadData = async () => {
            try {
                const [salesRes, productsRes, expensesRes] = await Promise.all([
                    getSales(),
                    fetchProducts(),
                    fetchExpenses()
                ]);

                if (productsRes.data) {
                    setAllProducts(productsRes.data);
                }

                const expData = expensesRes.data || [];
                setAllExpenses(expData);
                setFilteredExpenses(expData);

                if (salesRes.data) {
                    const mockVoids = JSON.parse(localStorage.getItem('mockVoids') || '[]');
                    const voidsMerged = mockVoids.map(v => ({ ...v, isVoided: true }));
                    const allData = [...salesRes.data, ...voidsMerged]
                        .filter(sale => (Number(sale.total) || Number(sale.total_amount) || 0) > 0) // skip 0-total orders
                        .sort((a, b) => new Date(b.paid_at || b.voided_at || b.created_at) - new Date(a.paid_at || a.voided_at || a.created_at));

                    setAllSales(allData);
                    setFilteredSales(allData);
                    calculateStats(allData, expData);
                }
            } catch (error) {
                console.error("Failed to load sales and expenses data", error);
            }
        };
        loadData();
    }, []);

    const calculateStats = (salesData, expensesData) => {
        const now = new Date();
        const todayStr = now.toLocaleDateString();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let todaySum = 0;
        let monthSum = 0;
        let yearSum = 0;

        (salesData || []).forEach(sale => {
            if (sale.isVoided) return; // Skip voided orders from revenue stats
            const saleDate = new Date(sale.paid_at || sale.created_at);
            const amount = Number(sale.total) || Number(sale.total_amount) || 0;

            // Today
            if (saleDate.toLocaleDateString() === todayStr) {
                todaySum += amount;
            }
            // This Month
            if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                monthSum += amount;
            }
            // This Year
            if (saleDate.getFullYear() === currentYear) {
                yearSum += amount;
            }
        });

        let todayExp = 0;
        let monthExp = 0;
        let yearExp = 0;

        (expensesData || []).forEach(exp => {
            const expDate = new Date(exp.created_at);
            const amount = Number(exp.amount) || 0;

            // Today
            if (expDate.toLocaleDateString() === todayStr) {
                todayExp += amount;
            }
            // This Month
            if (expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear) {
                monthExp += amount;
            }
            // This Year
            if (expDate.getFullYear() === currentYear) {
                yearExp += amount;
            }
        });

        setReportStats(prev => ({
            ...prev,
            today: todaySum,
            month: monthSum,
            year: yearSum,
            todayExpenses: todayExp,
            monthExpenses: monthExp,
            yearExpenses: yearExp,
            totalOrders: salesData.length
        }));
    };

    const applyFilter = () => {
        const start = dateRange.start ? new Date(dateRange.start) : new Date('2000-01-01');
        const end = dateRange.end ? new Date(dateRange.end) : new Date();
        end.setHours(23, 59, 59, 999); // End of day

        const filteredS = allSales.filter(sale => {
            const d = new Date(sale.paid_at || sale.created_at);
            return (!dateRange.start && !dateRange.end) || (d >= start && d <= end);
        });
        setFilteredSales(filteredS);

        const filteredE = allExpenses.filter(exp => {
            const d = new Date(exp.created_at);
            return (!dateRange.start && !dateRange.end) || (d >= start && d <= end);
        });
        setFilteredExpenses(filteredE);

        // Calc Custom Totals
        const customTotal = filteredS.reduce((sum, s) => s.isVoided ? sum : sum + (Number(s.total) || Number(s.total_amount) || 0), 0);
        const customExpenses = filteredE.reduce((sum, e) => sum + Number(e.amount), 0);

        setReportStats(prev => ({
            ...prev,
            custom: customTotal,
            customExpenses: customExpenses
        }));
    };

    const resetFilter = () => {
        setDateRange({ start: '', end: '' });
        setFilteredSales(allSales);
        setFilteredExpenses(allExpenses);
        setReportStats(prev => ({ ...prev, custom: 0, customExpenses: 0 }));
    };

    const formatPrice = (p) => `${Number(p).toLocaleString()} ${t('common.currency')}`;

    // Analyze Data for Reports (Memoized/Calculated on render)
    const { productList, topSeller, chartData, pieData, cashierStats, totalFilteredRevenue } = useMemo(() => {
        const productStats = {};
        const cashierMap = {};
        const hourlyStats = Array(24).fill(0).map((_, i) => ({ hour: `${i}:00`, sales: 0 }));
        let totalRev = 0;

        (filteredSales || []).forEach(sale => {
            if (sale.isVoided) return; // Ignore voided sales for charts
            const saleDate = new Date(sale.paid_at || sale.created_at);
            const hour = saleDate.getHours();
            const amount = Number(sale.total) || Number(sale.total_amount) || 0;
            totalRev += amount;

            // Hourly Trend
            if (hour >= 0 && hour < 24) {
                hourlyStats[hour].sales += amount;
            }

            if (sale.items) {
                // Defensive check for items array
                if (Array.isArray(sale.items)) {
                    sale.items.forEach(item => {
                        const key = item.name;
                        const pRef = allProducts.find(p => p.id === item.product_id) || allProducts.find(p => p.name === item.name) || {};
                        const keyNameCkb = item.name_ckb || pRef.name_ckb || item.name;

                        if (!productStats[key]) {
                            productStats[key] = {
                                name: key,
                                name_ckb: keyNameCkb,
                                qty: 0,
                                revenue: 0
                            };
                        }
                        productStats[key].qty += (item.quantity || 0);
                        productStats[key].revenue += ((item.price * item.quantity) || 0);
                    });
                }
            }

            // Cashier Stats
            const cName = sale.cashier_name || 'Unknown';
            if (!cashierMap[cName]) {
                cashierMap[cName] = { name: cName, count: 0, revenue: 0 };
            }
            cashierMap[cName].count += 1;
            cashierMap[cName].revenue += amount;
        });

        const list = Object.values(productStats).sort((a, b) => b.qty - a.qty);
        const cashierList = Object.values(cashierMap).sort((a, b) => b.revenue - a.revenue);
        const top5 = list.slice(0, 5).map(p => ({
            name: i18n.language === 'ckb' ? (p.name_ckb || p.name) : p.name,
            value: p.qty
        }));

        return {
            productList: list,
            topSeller: list.length > 0 ? list[0] : null,
            chartData: hourlyStats,
            pieData: top5,
            cashierStats: cashierList,
            totalFilteredRevenue: totalRev
        };
    }, [filteredSales, i18n.language, allProducts]);

    const handlePrint = () => {
        window.print();
    };

    // Group filtered sales by date for display
    const groupedSales = filteredSales.reduce((groups, sale) => {
        const dateObj = new Date(sale.paid_at || sale.created_at);
        const dateKey = formatDate(dateObj, i18n.language, t);

        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(sale);
        return groups;
    }, {});

    return (
        <AdminGuard>
            <div className="space-y-8">
                <h1 className="text-2xl font-black text-gray-800 dark:text-gray-100 flex items-center gap-3 flex-none">
                    <TrendUp size={32} className="text-cyan-500" />
                    {t('sales.reports.title')}
                </h1>

                {/* Reports / Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-none">
                    {/* Daily */}
                    <div className="glass-panel p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800/80 border-l-4 border-l-coffee-500 relative overflow-hidden flex flex-col justify-between min-h-[165px] hover-lift transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <CalendarBlank size={80} className="text-coffee-500" />
                        </div>
                        <div>
                            <p className="text-coffee-600 dark:text-coffee-400 font-bold mb-1 uppercase tracking-wider text-xs">{t('sales.reports.daily')}</p>
                            <p className={`text-2xl font-extrabold ${reportStats.today - reportStats.todayExpenses >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-700 dark:text-red-400'}`}>
                                {formatPrice(reportStats.today - reportStats.todayExpenses)}
                                <span className="text-[10px] font-bold block text-gray-400 dark:text-gray-500 mt-0.5">{i18n.language === 'ckb' ? 'سافی قازانج' : 'NET PROFIT'}</span>
                            </p>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                            <div>
                                <span>{i18n.language === 'ckb' ? 'داهات:' : 'Sales:'} </span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{formatPrice(reportStats.today)}</span>
                            </div>
                            <div>
                                <span>{i18n.language === 'ckb' ? 'خەرجی:' : 'Expenses:'} </span>
                                <span className="font-bold text-red-650 dark:text-red-400">{formatPrice(reportStats.todayExpenses)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Monthly */}
                    <div className="glass-panel p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800/80 border-l-4 border-l-blue-500 relative overflow-hidden flex flex-col justify-between min-h-[165px] hover-lift transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <CalendarBlank size={80} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-blue-600 dark:text-blue-400 font-bold mb-1 uppercase tracking-wider text-xs">{t('sales.reports.monthly')}</p>
                            <p className={`text-2xl font-extrabold ${reportStats.month - reportStats.monthExpenses >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-700 dark:text-red-400'}`}>
                                {formatPrice(reportStats.month - reportStats.monthExpenses)}
                                <span className="text-[10px] font-bold block text-gray-400 dark:text-gray-500 mt-0.5">{i18n.language === 'ckb' ? 'سافی قازانج' : 'NET PROFIT'}</span>
                            </p>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                            <div>
                                <span>{i18n.language === 'ckb' ? 'داهات:' : 'Sales:'} </span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{formatPrice(reportStats.month)}</span>
                            </div>
                            <div>
                                <span>{i18n.language === 'ckb' ? 'خەرجی:' : 'Expenses:'} </span>
                                <span className="font-bold text-red-650 dark:text-red-400">{formatPrice(reportStats.monthExpenses)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Yearly */}
                    <div className="glass-panel p-6 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-800/80 border-l-4 border-l-cyan-500 relative overflow-hidden flex flex-col justify-between min-h-[165px] hover-lift transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <TrendUp size={80} className="text-cyan-500" />
                        </div>
                        <div>
                            <p className="text-cyan-600 dark:text-cyan-400 font-bold mb-1 uppercase tracking-wider text-xs">{t('sales.reports.yearly')}</p>
                            <p className={`text-2xl font-extrabold ${reportStats.year - reportStats.yearExpenses >= 0 ? 'text-gray-800 dark:text-white' : 'text-red-700 dark:text-red-400'}`}>
                                {formatPrice(reportStats.year - reportStats.yearExpenses)}
                                <span className="text-[10px] font-bold block text-gray-400 dark:text-gray-500 mt-0.5">{i18n.language === 'ckb' ? 'سافی قازانج' : 'NET PROFIT'}</span>
                            </p>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                            <div>
                                <span>{i18n.language === 'ckb' ? 'داهات:' : 'Sales:'} </span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">{formatPrice(reportStats.year)}</span>
                            </div>
                            <div>
                                <span>{i18n.language === 'ckb' ? 'خەرجی:' : 'Expenses:'} </span>
                                <span className="font-bold text-red-650 dark:text-red-400">{formatPrice(reportStats.yearExpenses)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- ANALYTICS CHARTS SECTION --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:hidden">
                    {/* Hourly Trend Chart */}
                    <div className="glass-panel p-6 rounded-2xl shadow-sm hover-lift">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">{t('sales.reports.analytics_trend')}</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                                    <XAxis dataKey="hour" fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" tickFormatter={(val) => `${val / 1000}k`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                                        }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                        labelStyle={{ fontWeight: 'bold', color: '#94a3b8' }}
                                        formatter={(value) => [formatPrice(value), t('sales.reports.revenue')]}
                                    />
                                    <Bar dataKey="sales" fill="url(#colorSales)" radius={[6, 6, 0, 0]} barSize={24} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Top Products Pie Chart */}
                    <div className="glass-panel p-6 rounded-2xl shadow-sm hover-lift flex flex-col items-center justify-center">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 self-start">{t('sales.reports.analytics_products')}</h3>
                        <div className="h-64 w-full flex items-center justify-center">
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value, name) => [value, name]}
                                        />
                                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-gray-400 italic">No data</div>
                            )}
                        </div>
                    </div>

                    {/* Cashier Performance Card */}
                    <div className="glass-panel p-6 rounded-2xl shadow-sm hover-lift flex flex-col col-span-1 lg:col-span-2">
                        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4">{t('sales.reports.cashier_performance') || "Cashier Performance"}</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="p-3">{t('receipt.cashier')}</th>
                                        <th className="p-3 text-center">{t('sales.reports.sold_qty')}</th>
                                        <th className="p-3 text-right">{t('sales.reports.revenue')}</th>
                                        <th className="p-3 text-right">%</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-600 text-sm">
                                    {cashierStats.length === 0 ? (
                                        <tr><td colSpan="4" className="p-4 text-center text-gray-400">No data</td></tr>
                                    ) : (
                                        cashierStats.map((c, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className="p-3 font-medium text-gray-700 dark:text-gray-200">{c.name}</td>
                                                <td className="p-3 text-center text-gray-600 dark:text-gray-400">{c.count}</td>
                                                <td className="p-3 text-right font-bold text-green-600 dark:text-green-400">{formatPrice(c.revenue)}</td>
                                                <td className="p-3 text-right text-gray-500 text-xs">
                                                    {totalFilteredRevenue > 0 ? ((c.revenue / totalFilteredRevenue) * 100).toFixed(1) + '%' : '0%'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Date Range Filter */}
                <div className="glass-panel p-6 rounded-2xl shadow-sm hover-lift">
                    <h3 className="font-bold text-slate-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <Funnel size={20} className="text-cyan-500" /> {t('sales.reports.custom_range')}
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-sm text-gray-500 dark:text-gray-400">{t('sales.reports.from')}</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="p-2.5 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:bg-[#11192e] dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                            <label className="text-sm text-gray-500 dark:text-gray-400">{t('sales.reports.to')}</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="p-2.5 border border-gray-200 dark:border-slate-800 rounded-xl outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:bg-[#11192e] dark:text-white"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={applyFilter} className="bg-gradient-to-r from-cyan-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-600 shadow-lg shadow-cyan-500/10 font-bold">
                                {t('sales.reports.apply')}
                            </Button>
                            <button
                                onClick={resetFilter}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                                <ArrowCounterClockwise size={18} />
                                {t('sales.reports.reset')}
                            </button>
                            {(dateRange.start || dateRange.end) && (
                                <button
                                    onClick={handlePrint}
                                    className="px-4 py-2 bg-coffee-800 dark:bg-coffee-600 text-white rounded-lg hover:bg-coffee-900 dark:hover:bg-coffee-700 flex items-center gap-2"
                                >
                                    <Receipt size={18} />
                                    {t('sales.reports.print_report')}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Result Stat */}
                    {(dateRange.start || dateRange.end) && (
                        <div className="mt-8 space-y-6">
                            {/* Summary Bar */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 bg-orange-50 dark:bg-orange-900/30 p-5 rounded-xl text-orange-850 dark:text-orange-300">
                                <div className="flex justify-between items-center px-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{i18n.language === 'ckb' ? 'کۆی داهات:' : 'Total Sales:'}</span>
                                    <span className="text-xl font-bold text-green-700 dark:text-green-400">{formatPrice(reportStats.custom)}</span>
                                </div>
                                <div className="flex justify-between items-center px-2 md:border-l md:border-r border-orange-200 dark:border-orange-800/60">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{i18n.language === 'ckb' ? 'کۆی خەرجی:' : 'Total Expenses:'}</span>
                                    <span className="text-xl font-bold text-red-650 dark:text-red-400">{formatPrice(reportStats.customExpenses || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center px-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{i18n.language === 'ckb' ? 'قازانجی سافی:' : 'Net Profit:'}</span>
                                    <span className={`text-xl font-bold ${reportStats.custom - (reportStats.customExpenses || 0) >= 0 ? 'text-green-800 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                        {formatPrice(reportStats.custom - (reportStats.customExpenses || 0))}
                                    </span>
                                </div>
                            </div>

                            {/* Product Analysis */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Top Seller Card */}
                                {topSeller && (
                                    <div className="bg-gradient-to-br from-yellow-50 to-white dark:from-gray-800 dark:to-gray-800 p-6 rounded-xl border border-yellow-200 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mb-2">
                                            <TrendUp size={32} weight="fill" />
                                        </div>
                                        <h3 className="text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest text-xs mb-1">{t('sales.reports.top_seller')}</h3>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                            {t('lang') === 'ckb' ? (topSeller.name_ckb || topSeller.name) : topSeller.name}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{topSeller.qty} {t('sales.reports.sold_qty')}</p>
                                    </div>
                                )}

                                {/* Product Breakdown Table */}
                                {productList.length > 0 && (
                                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden col-span-1 md:col-span-1">
                                        <div className="p-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 font-bold text-gray-700 dark:text-gray-200">
                                            {t('sales.reports.product_breakdown')}
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2">{t('cashier.item')}</th>
                                                        <th className="px-4 py-2 text-center">{t('sales.reports.sold_qty')}</th>
                                                        <th className="px-4 py-2 text-right">{t('sales.reports.revenue')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                                                    {productList.map((prod, idx) => (
                                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                            <td className="px-4 py-2 font-medium">
                                                                {i18n.language === 'ckb' ? (prod.name_ckb || prod.name) : prod.name}
                                                            </td>
                                                            <td className="px-4 py-2 text-center">{prod.qty}</td>
                                                            <td className="px-4 py-2 text-right">{formatPrice(prod.revenue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sales List Grouped by Day (Screen) */}
                <div className="print:hidden">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                        <Receipt size={20} /> {t('dashboard')} / {t('sales.title')}
                    </h3>
                    {Object.keys(groupedSales).length === 0 ? (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700 p-8 text-center text-gray-400">
                            {t('sales.no_sales')}
                        </div>
                    ) : (
                        Object.entries(groupedSales).map(([date, daySales]) => (
                            <div key={date} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700 overflow-hidden mb-6">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                                    <h2 className="font-bold text-lg text-coffee-900 dark:text-gray-100">{date}</h2>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                        {t('cashier.total')}: {formatPrice(daySales.reduce((sum, s) => s.isVoided ? sum : sum + (Number(s.total) || Number(s.total_amount) || 0), 0))}
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-white dark:bg-gray-800 text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                            <tr>
                                                <th className="p-4 w-24 rtl:text-right">{t('cashier.order')} ID</th>
                                                <th className="p-4 w-32 rtl:text-right">{t('sales.time')}</th>
                                                <th className="p-4 w-32 rtl:text-right">{t('cashier.table')}</th>
                                                <th className="p-4 rtl:text-right">{t('sales.items')}</th>
                                                <th className="p-4 w-28 rtl:text-right">{i18n.language === 'ckb' ? 'جۆری پارەدان' : 'Payment'}</th>
                                                <th className="p-4 text-right w-32 rtl:text-left">{t('cashier.total')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                                            {daySales.map(sale => (
                                                <tr key={sale.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${sale.isVoided ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                                    <td className="p-4 font-medium text-gray-600 dark:text-gray-300">#{String(sale.id).slice(-4)}</td>
                                                    <td className="p-4 text-gray-500 dark:text-gray-400">
                                                        <div className="flex flex-col">
                                                            <span>{formatTime(sale.paid_at || sale.created_at, i18n.language)}</span>
                                                            {sale.isVoided && <span className="text-xs text-red-500 font-medium mt-0.5">{t('cashier.voided_reason')} {sale.reason}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs">
                                                            {t('cashier.table')} {sale.table_id || '-'}
                                                        </span>
                                                    </td>
                                                    <td className={`p-4 text-gray-600 dark:text-gray-300 ${sale.isVoided ? 'line-through opacity-70' : ''}`}>
                                                        {sale.items && sale.items.length > 0 ? (
                                                            <span>{sale.items.map(i => {
                                                                const pRef = allProducts.find(p => p.id === i.product_id) || allProducts.find(p => p.name === i.name) || {};
                                                                const ckbName = i.name_ckb || pRef.name_ckb || i.name;
                                                                return i18n.language === 'ckb' ? ckbName : i.name;
                                                            }).join(', ')}</span>
                                                        ) : (
                                                            <span className="italic text-gray-400">No items</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {sale.payment_method === 'debt' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                                                📋 {i18n.language === 'ckb' ? 'قەرز' : 'Debt'}
                                                                {sale.debt_customer_name && <span className="font-normal opacity-80 truncate max-w-[60px]"> — {sale.debt_customer_name}</span>}
                                                            </span>
                                                        ) : sale.payment_method === 'card' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                                                                💳 {i18n.language === 'ckb' ? 'کارت' : 'Card'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                                                                💵 {i18n.language === 'ckb' ? 'نەقد' : 'Cash'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className={`p-4 text-right font-bold ${sale.isVoided ? 'line-through text-red-400 dark:text-red-500/70' : 'text-green-600 dark:text-green-400'}`}>
                                                        {formatPrice(sale.total_amount || sale.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* PRINT-ONLY View */}
                <div id="print-report" className="hidden print:block bg-white p-8 text-black" dir={i18n.language === 'ckb' ? 'rtl' : 'ltr'}>
                    <div className="text-center mb-8 border-b-2 border-black pb-4">
                        <h1 className="text-3xl font-bold mb-2">{t('sales.reports.title')}</h1>
                        <p className="text-lg">
                            {t('sales.reports.from')}: {formatDate(dateRange.start, i18n.language, t)} - {t('sales.reports.to')}: {formatDate(dateRange.end || Date.now(), i18n.language, t)}
                        </p>
                    </div>

                    <div className="mb-8 p-4 border border-black rounded-lg bg-gray-50 space-y-2">
                        <div className="flex justify-between items-center text-lg">
                            <span>{i18n.language === 'ckb' ? 'کۆی داهات:' : 'Total Sales:'}</span>
                            <span>{formatPrice(dateRange.start || dateRange.end ? reportStats.custom : reportStats.today)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg text-red-600">
                            <span>{i18n.language === 'ckb' ? 'کۆی خەرجی:' : 'Total Expenses:'}</span>
                            <span>{formatPrice(dateRange.start || dateRange.end ? reportStats.customExpenses : reportStats.todayExpenses)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold border-t border-gray-300 pt-2">
                            <span>{i18n.language === 'ckb' ? 'سافی قازانج:' : 'Net Profit:'}</span>
                            <span>
                                {formatPrice(
                                    (dateRange.start || dateRange.end ? reportStats.custom : reportStats.today) - 
                                    (dateRange.start || dateRange.end ? reportStats.customExpenses : reportStats.todayExpenses)
                                )}
                            </span>
                        </div>
                    </div>

                    {topSeller && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold border-b border-black mb-2">{t('sales.reports.top_seller')}</h2>
                            <div className="flex justify-between items-center">
                                <span className="text-lg">{i18n.language === 'ckb' ? (topSeller.name_ckb || topSeller.name) : topSeller.name}</span>
                                <span className="font-bold">{topSeller.qty} {t('sales.reports.sold_qty')}</span>
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <h2 className="text-xl font-bold border-b border-black mb-4">{t('sales.reports.product_breakdown')}</h2>
                        <table className="w-full text-left border-collapse border border-black">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border border-black p-2">{t('cashier.item')}</th>
                                    <th className="border border-black p-2 text-center">{t('sales.reports.sold_qty')}</th>
                                    <th className="border border-black p-2 text-right">{t('sales.reports.revenue')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productList.map((prod, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-black p-2 font-medium">
                                            {t('lang') === 'ckb' ? (prod.name_ckb || prod.name) : prod.name}
                                        </td>
                                        <td className="border border-black p-2 text-center">{prod.qty}</td>
                                        <td className="border border-black p-2 text-right">{formatPrice(prod.revenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="text-center text-sm text-gray-500 mt-12">
                        {formatDate(new Date(), i18n.language, t)} {formatTime(new Date(), i18n.language)}
                    </div>
                </div>

            </div>
        </AdminGuard >
    );
};

export default SalesPage;
