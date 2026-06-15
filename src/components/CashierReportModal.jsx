import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getSales } from '../api';
import { X, Printer, CalendarBlank, TrendUp, Receipt } from '@phosphor-icons/react';
import Button from './Button';
import { formatTime } from '../utils/dateFormatter';

const CashierReportModal = ({ onClose, currentUser }) => {
    const { t, i18n } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [allSalesData, setAllSalesData] = useState([]);
    const [selectedCashierFilter, setSelectedCashierFilter] = useState('All');
    const [cashierNames, setCashierNames] = useState([]);

    const [stats, setStats] = useState({
        today: 0,
        month: 0,
        countConfig: 0,
        todayOrders: [],
        cashierBreakdown: {}
    });

    const formatPrice = (p) => `${Number(p).toLocaleString()} ${t('common.currency')}`;

    useEffect(() => {
        loadSales();
    }, []);

    useEffect(() => {
        calculateStats();
    }, [allSalesData, selectedCashierFilter]);

    const loadSales = async () => {
        try {
            const { data } = await getSales();
            if (data) {
                setAllSalesData(data);

                // Extract unique cashier names
                const names = new Set();
                data.forEach(s => {
                    if (s.cashier_name) names.add(s.cashier_name);
                });
                setCashierNames(Array.from(names).sort());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = () => {
        const now = new Date();
        const todayStr = now.toLocaleDateString();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let todaySum = 0;
        let monthSum = 0;
        let todayOrdersList = [];

        allSalesData.forEach(sale => {
            const saleDate = new Date(sale.paid_at || sale.created_at);
            const amount = Number(sale.total_amount || sale.total || 0);
            const cashierName = sale.cashier_name || 'Unknown';

            // Filter by Cashier if selected
            if (selectedCashierFilter !== 'All' && cashierName !== selectedCashierFilter) {
                return;
            }

            // Today
            if (saleDate.toLocaleDateString() === todayStr) {
                todaySum += amount;
                todayOrdersList.push({
                    ...sale,
                    time: formatTime(saleDate, i18n.language)
                });
            }
            // This Month
            if (saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear) {
                monthSum += amount;
            }
        });

        // Add Voided Orders (So they appear in report for tracking)
        const mockVoids = JSON.parse(localStorage.getItem('mockVoids') || '[]');
        mockVoids.forEach(voidOrder => {
            const saleDate = new Date(voidOrder.voided_at || voidOrder.created_at);
            const cashierName = voidOrder.cashier_name || 'Unknown';

            if (selectedCashierFilter !== 'All' && cashierName !== selectedCashierFilter) {
                return;
            }

            if (saleDate.toLocaleDateString() === todayStr) {
                todayOrdersList.push({
                    ...voidOrder,
                    isVoided: true,
                    time: formatTime(saleDate, i18n.language)
                });
            }
        });

        // Sort today's orders new -> old
        todayOrdersList.sort((a, b) => new Date(b.paid_at || b.voided_at || b.created_at) - new Date(a.paid_at || a.voided_at || a.created_at));

        // Calculate Cashier Breakdown (for the filtered view, it will just be one entry, but useful for 'All')
        const cashierBreakdown = {};
        todayOrdersList.forEach(order => {
            if (order.isVoided) return; // Don't count void money for the cashier total
            const name = order.cashier_name || 'Unknown';
            const amount = Number(order.total_amount || order.total || 0);
            cashierBreakdown[name] = (cashierBreakdown[name] || 0) + amount;
        });

        setStats({
            today: todaySum,
            month: monthSum,
            todayCount: todayOrdersList.length,
            todayOrders: todayOrdersList,
            cashierBreakdown
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in print:absolute print:inset-0 print:bg-white print:animate-none print:z-[9999] print:block print:h-auto print:overflow-visible print:p-0">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:h-auto print:overflow-visible print:rounded-none">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 print:hidden">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Receipt size={24} className="text-coffee-600" />
                            {t('sales.reports.title') || "Sales Report"}
                        </h2>

                        {/* Cashier Filter Dropdown */}
                        <select
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-coffee-500 dark:text-gray-200"
                            value={selectedCashierFilter}
                            onChange={(e) => setSelectedCashierFilter(e.target.value)}
                        >
                            <option value="All">All Cashiers</option>
                            {cashierNames.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col overflow-hidden p-6 print:hidden">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coffee-600"></div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-shrink-0 space-y-6 mb-6">
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-100 dark:border-green-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-green-700 dark:text-green-400 font-bold uppercase text-xs tracking-wider mb-1">{t('sales.reports.daily') || "Today's Sales"}</p>
                                            <p className="text-2xl font-extrabold text-green-800 dark:text-green-300">{formatPrice(stats.today)}</p>
                                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">{stats.todayCount} Orders</p>
                                        </div>
                                        <div className="w-12 h-12 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center text-green-600 dark:text-green-300">
                                            <CalendarBlank size={24} weight="fill" />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-blue-700 dark:text-blue-400 font-bold uppercase text-xs tracking-wider mb-1">{t('sales.reports.monthly') || "Monthly Sales"}</p>
                                            <p className="text-2xl font-extrabold text-blue-800 dark:text-blue-300">{formatPrice(stats.month)}</p>
                                        </div>
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
                                            <TrendUp size={24} weight="fill" />
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Today's Orders Table */}
                            <div className="flex-1 min-h-0 flex flex-col">
                                <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-3">{t('sales.reports.daily') || "Today's Orders"}</h3>
                                <div className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden flex-1 flex flex-col bg-white dark:bg-gray-800">
                                    <div className="overflow-y-auto flex-1">
                                        <table className="w-full text-left text-sm relative">
                                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="p-3 bg-gray-50 dark:bg-gray-700">{t('cashier.order')}</th>
                                                    <th className="p-3 bg-gray-50 dark:bg-gray-700">{t('sales.time')}</th>
                                                    <th className="p-3 text-right bg-gray-50 dark:bg-gray-700">{t('cashier.total')}</th>
                                                    <th className="p-3 text-right bg-gray-50 dark:bg-gray-700">{t('receipt.cashier')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {stats.todayOrders.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="4" className="p-4 text-center text-gray-400">No sales today</td>
                                                    </tr>
                                                ) : (
                                                    stats.todayOrders.map(order => (
                                                        <tr key={order.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${order.isVoided ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                                                            <td className="p-3 font-medium dark:text-gray-200">#{order.id}</td>
                                                            <td className="p-3 text-gray-500 dark:text-gray-400 px-3">
                                                                <div className="flex flex-col">
                                                                    <span>{order.time}</span>
                                                                    {order.isVoided && <span className="text-xs text-red-500 font-medium mt-0.5">{t('cashier.voided_reason')} {order.reason}</span>}
                                                                </div>
                                                            </td>
                                                            <td className={`p-3 text-right font-bold ${order.isVoided ? 'line-through text-red-400 dark:text-red-500/70' : 'text-gray-700 dark:text-gray-200'}`}>
                                                                {formatPrice(order.total_amount || order.total)}
                                                            </td>
                                                            <td className="p-3 text-right text-gray-500 dark:text-gray-400 text-xs">
                                                                {order.cashier_name || '-'}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end gap-2 print:hidden">
                    <Button onClick={handlePrint} variant="secondary" className="flex items-center gap-2">
                        <Printer size={18} />
                        {t('sales.reports.print_report') || "Print Report"}
                    </Button>
                    <Button onClick={onClose} variant="primary">
                        {t('common.close') || "Close"}
                    </Button>
                </div>

                {/* Print Only Section */}
                <div id="sales-report-print" className="hidden print:block bg-white p-8 text-black w-full h-auto overflow-visible">
                    <div className="text-center mb-6 border-b-2 border-dashed border-gray-300 pb-4">
                        <h1 className="text-2xl font-bold">{t('sales.reports.z_report')}</h1>
                        <p className="text-sm text-gray-500">{new Date().toLocaleString()}</p>
                        <p className="font-bold mt-2">{t('receipt.cashier')}: {selectedCashierFilter === 'All' ? t('categories.All') : selectedCashierFilter}</p>
                    </div>

                    <div className="mb-6">
                        <div className="flex justify-between text-xl font-bold mb-2">
                            <span>{t('sales.reports.daily')}:</span>
                            <span>{formatPrice(stats.today)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>{t('sales.total_orders')}:</span>
                            <span>{stats.todayCount}</span>
                        </div>
                    </div>

                    {/* Print Orders Table */}
                    <div className="mb-6">
                        <h3 className="font-bold border-b border-black mb-2 pb-1">{t('sales.reports.orders_list')}</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left">
                                    <th className="pb-2">#</th>
                                    <th className="pb-2">{t('sales.time')}</th>
                                    <th className="pb-2 text-right">{t('cashier.total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.todayOrders.map(order => (
                                    <tr key={order.id} className="border-b border-dashed border-gray-200">
                                        <td className="py-2 valign-top">#{order.id}</td>
                                        <td className="py-2 valign-top">
                                            <div>{order.time}</div>
                                            {order.isVoided && <div className="text-xs italic text-gray-500 mt-1">{t('cashier.voided_reason')} {order.reason}</div>}
                                        </td>
                                        <td className={`py-2 text-right valign-top ${order.isVoided ? 'line-through text-gray-400' : ''}`}>
                                            {formatPrice(order.total_amount || order.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 pt-4">
                        <p className="text-center text-xs text-gray-400">{t('app_title')} System</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CashierReportModal;
