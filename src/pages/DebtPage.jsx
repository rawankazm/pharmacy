import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api, getSales } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import { BookOpen, User, Phone, CheckCircle, Clock, Eye, X, Receipt } from '@phosphor-icons/react';
import { formatDate, formatTime } from '../utils/dateFormatter';

const DebtPage = () => {
    const { t, i18n } = useTranslation();
    const [debts, setDebts] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null); // { name, phone, records: [] }
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showCollectModal, setShowCollectModal] = useState(false);
    const [collectAmount, setCollectAmount] = useState('');
    const [targetCustomer, setTargetCustomer] = useState(null); // { name, phone, outstanding, records: [] }

    const formatPrice = (price) => `${Number(price).toLocaleString()} ${t('common.currency')}`;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [debtsRes, salesRes] = await Promise.all([api.get('/debts'), getSales()]);
            setDebts(debtsRes.data || []);
            setSales(salesRes.data || []);
        } catch (error) {
            console.error("Failed to load debts/sales:", error);
            // Direct localStorage fallback
            setDebts(JSON.parse(localStorage.getItem('mockDebts') || '[]'));
            setSales(JSON.parse(localStorage.getItem('mockSales') || '[]'));
        } finally {
            setLoading(false);
        }
    };

    // Aggregate debts by customer
    const customersMap = {};
    debts.forEach(d => {
        const key = `${d.customer_name.trim()}-${d.customer_phone.trim()}`;
        if (!customersMap[key]) {
            customersMap[key] = {
                name: d.customer_name.trim(),
                phone: d.customer_phone.trim(),
                totalDebt: 0,
                records: []
            };
        }
        customersMap[key].records.push(d);
        if (d.status === 'unpaid') {
            customersMap[key].totalDebt += parseFloat(d.amount);
        }
    });

    const customersList = Object.values(customersMap).sort((a, b) => b.totalDebt - a.totalDebt);

    const filteredCustomers = customersList.filter(c => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    });

    // Summary statistics
    const totalOutstanding = debts
        .filter(d => d.status === 'unpaid')
        .reduce((sum, d) => sum + parseFloat(d.amount), 0);

    const activeDebtorsCount = customersList.filter(c => c.totalDebt > 0).length;

    const clearedDebtsCount = debts.filter(d => d.status === 'paid').length;

    const handleCollectPayment = async (e) => {
        e.preventDefault();
        const payment = parseFloat(collectAmount);
        if (isNaN(payment) || payment <= 0) {
            toast.error("Please enter a valid payment amount.");
            return;
        }

        if (payment > targetCustomer.outstanding) {
            toast.error("Collected payment amount cannot exceed outstanding debt.");
            return;
        }

        let remainingPayment = payment;
        const unpaidRecords = targetCustomer.records
            .filter(r => r.status === 'unpaid')
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); // FIFO settlement

        const toastId = toast.loading("Processing payment collection...");
        try {
            for (const record of unpaidRecords) {
                if (remainingPayment <= 0) break;

                const recordAmount = parseFloat(record.amount);
                if (remainingPayment >= recordAmount) {
                    // Fully clear this specific debt record
                    remainingPayment -= recordAmount;
                    await api.put(`/debts/${record.id}`, {
                        ...record,
                        status: 'paid',
                        amount: recordAmount
                    });
                    updateLocalDebtRecord(record.id, 'paid', recordAmount);
                } else {
                    // Partially pay down this debt record
                    const newAmount = recordAmount - remainingPayment;
                    remainingPayment = 0;
                    await api.put(`/debts/${record.id}`, {
                        ...record,
                        amount: newAmount
                    });
                    updateLocalDebtRecord(record.id, 'unpaid', newAmount);
                }
            }

            toast.success("Payment collected and cleared!", { id: toastId });
            setShowCollectModal(false);
            setCollectAmount('');
            loadData();
        } catch (error) {
            console.error("Payment collection failed:", error);
            toast.error("Failed to process payment collection.", { id: toastId });
        }
    };

    const updateLocalDebtRecord = (id, status, amount) => {
        const mockDebts = JSON.parse(localStorage.getItem('mockDebts') || '[]');
        const idx = mockDebts.findIndex(d => d.id === id);
        if (idx >= 0) {
            mockDebts[idx].status = status;
            mockDebts[idx].amount = amount;
            localStorage.setItem('mockDebts', JSON.stringify(mockDebts));
        }
    };

    const getOrderDetails = (orderId) => {
        const sale = sales.find(s => s.id === orderId);
        if (!sale) return null;
        return sale;
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-coffee-900 dark:text-gray-100 flex items-center gap-3">
                    <BookOpen size={32} />
                    {t('debts.title') || "Customer Debt Notebook"}
                </h1>
                <Button onClick={loadData} variant="outline" className="flex items-center gap-2">
                    {t('common.refresh') || "Refresh"}
                </Button>
            </div>

            {/* Statistics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Outstanding */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-coffee-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">{t('debts.amount') || "Total Outstanding Debt"}</p>
                        <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{formatPrice(totalOutstanding)}</h3>
                    </div>
                    <div className="p-3 rounded-full bg-red-50 dark:bg-red-950/20 text-red-600">
                        <Clock size={28} />
                    </div>
                </div>

                {/* Active Debtors */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-coffee-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">{t('debts.active_debtors') || "Active Debtors"}</p>
                        <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{activeDebtorsCount}</h3>
                    </div>
                    <div className="p-3 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-600">
                        <User size={28} />
                    </div>
                </div>

                {/* Cleared Debts */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-coffee-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-semibold">{t('debts.cleared_debts') || "Cleared Records"}</p>
                        <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{clearedDebtsCount}</h3>
                    </div>
                    <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600">
                        <CheckCircle size={28} />
                    </div>
                </div>
            </div>

            {/* Debtor Registry Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-coffee-50 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="w-full md:max-w-md">
                        <Input
                            placeholder={t('debts.search_placeholder') || "Search by name or phone..."}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-400 dark:text-gray-500">Loading data...</div>
                ) : filteredCustomers.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 dark:text-gray-500">{t('debts.no_debts') || "No outstanding debts recorded."}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left rtl:text-right">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm uppercase">
                                <tr>
                                    <th className="py-3 px-6">{t('debts.customer') || "Customer Name"}</th>
                                    <th className="py-3 px-6">{t('debts.phone') || "Phone Number"}</th>
                                    <th className="py-3 px-6 text-center">{t('debts.records_count') || "Debt Count"}</th>
                                    <th className="py-3 px-6 text-right rtl:text-left">{t('debts.amount') || "Outstanding Debt"}</th>
                                    <th className="py-3 px-6 text-center">{t('debts.status') || "Status"}</th>
                                    <th className="py-3 px-6 text-center">{t('common.actions') || "Actions"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredCustomers.map((customer, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-4 px-6 font-bold dark:text-gray-200">{customer.name}</td>
                                        <td className="py-4 px-6 text-gray-600 dark:text-gray-400">{customer.phone}</td>
                                        <td className="py-4 px-6 text-center text-gray-600 dark:text-gray-400">{customer.records.filter(r => r.status === 'unpaid').length}</td>
                                        <td className="py-4 px-6 text-right rtl:text-left font-bold text-coffee-600 dark:text-coffee-400">
                                            {formatPrice(customer.totalDebt)}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {customer.totalDebt > 0 ? (
                                                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold dark:bg-red-900/30 dark:text-red-400">
                                                    {t('debts.unpaid') || "Unpaid"}
                                                </span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold dark:bg-green-900/30 dark:text-green-400">
                                                    {t('debts.paid') || "Cleared"}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex gap-2 justify-center">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedCustomer(customer);
                                                        setShowHistoryModal(true);
                                                    }}
                                                    className="flex items-center gap-1"
                                                >
                                                    <Eye size={16} />
                                                    {t('debts.history') || "History"}
                                                </Button>
                                                {customer.totalDebt > 0 && (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        onClick={() => {
                                                            setTargetCustomer({
                                                                name: customer.name,
                                                                phone: customer.phone,
                                                                outstanding: customer.totalDebt,
                                                                records: customer.records
                                                            });
                                                            setShowCollectModal(true);
                                                        }}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <CheckCircle size={16} />
                                                        {t('debts.collect') || "Collect"}
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Debt History Modal */}
            {showHistoryModal && selectedCustomer && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <div>
                                <h2 className="text-xl font-bold dark:text-gray-100">{t('debts.history') || "Debt History"} - {selectedCustomer.name}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedCustomer.phone}</p>
                            </div>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                <X size={24} weight="bold" />
                            </button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            {selectedCustomer.records.map((record, idx) => {
                                const sale = getOrderDetails(record.order_id);
                                return (
                                    <div key={idx} className="border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
                                        <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex items-center gap-2">
                                                <Clock size={18} className="text-gray-400" />
                                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                                    {formatDate(record.created_at, i18n.language, t)} {formatTime(record.created_at, i18n.language)}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">Order #{record.order_id}</span>
                                                {record.status === 'unpaid' ? (
                                                    <span className="bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-bold dark:bg-red-900/30 dark:text-red-400">
                                                        {t('debts.unpaid') || "Unpaid"}
                                                    </span>
                                                ) : (
                                                    <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-bold dark:bg-green-900/30 dark:text-green-400">
                                                        {t('debts.paid') || "Cleared"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-white dark:bg-gray-800 flex justify-between items-start">
                                            <div className="space-y-2 flex-1">
                                                <h4 className="text-xs uppercase text-gray-400 font-bold tracking-wider">{t('cashier.items') || "Purchased Items"}</h4>
                                                {sale ? (
                                                    <ul className="space-y-1">
                                                        {sale.items.map((item, itemIdx) => (
                                                            <li key={itemIdx} className="text-sm dark:text-gray-300">
                                                                {item.quantity}x {item.name || item.product_name} - <span className="text-gray-500">{formatPrice(item.price)}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="text-sm text-gray-400 italic">No item logs stored for this offline order.</p>
                                                )}
                                            </div>
                                            <div className="text-right border-l dark:border-gray-700 pl-4">
                                                <span className="block text-xs uppercase text-gray-400 font-bold tracking-wider">{t('cashier.total')}</span>
                                                <span className="block text-lg font-bold text-coffee-600 dark:text-coffee-400">{formatPrice(record.amount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Collect Payment Modal */}
            {showCollectModal && targetCustomer && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowCollectModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                            <h2 className="text-xl font-bold dark:text-gray-100">{t('debts.collect') || "Collect Payment"}</h2>
                            <button onClick={() => setShowCollectModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                <X size={24} weight="bold" />
                            </button>
                        </div>
                        <form onSubmit={handleCollectPayment} className="flex-1 flex flex-col">
                            <div className="p-6 space-y-4">
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-1">
                                    <p className="text-xs text-amber-800 dark:text-amber-400 font-bold uppercase tracking-wider">{t('debts.customer') || "Customer"}</p>
                                    <p className="text-base font-bold dark:text-gray-200">{targetCustomer.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{targetCustomer.phone}</p>
                                    <div className="flex justify-between border-t border-amber-200/50 mt-2 pt-2 text-sm">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('debts.amount') || "Outstanding balance"}</span>
                                        <span className="font-bold text-red-600 dark:text-red-400">{formatPrice(targetCustomer.outstanding)}</span>
                                    </div>
                                </div>

                                <Input
                                    label={t('debts.amount_to_pay') || "Payment Amount to Collect"}
                                    value={collectAmount}
                                    onChange={e => setCollectAmount(e.target.value)}
                                    type="number"
                                    step="any"
                                    placeholder={String(targetCustomer.outstanding)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowCollectModal(false);
                                        setCollectAmount('');
                                    }}
                                    className="flex-1"
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                >
                                    {t('common.confirm')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebtPage;
