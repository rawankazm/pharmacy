import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
    ShoppingCart, Pill, Truck, Receipt, FilePlus, FirstAid, UserPlus,
    Coins, ClipboardText, Package, Warehouse, Sliders, WarningCircle, Clock, Trash, Storefront
} from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import AdminGuard from '../components/AdminGuard';
import { getSales, fetchProducts, fetchExpenses } from '../api';

const DashboardPage = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [sales, setSales] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [sRes, eRes, pRes] = await Promise.all([getSales(), fetchExpenses(), fetchProducts()]);
                setSales(sRes.data || []);
                setExpenses(eRes.data || []);
                setProducts(pRes.data || []);
            } catch (err) {
                console.error("Dashboard data load error:", err);
            }
            setLoading(false);
        };
        load();
    }, []);

    // ── Metric Data Calculations ──
    const now = new Date();
    const todayStr = now.toDateString();

    // 1. Purchases
    const incomingReceipts = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('incomingReceipts') || '[]');
        } catch {
            return [];
        }
    }, []);
    const totalPurchases = incomingReceipts.length;
    const todayPurchases = incomingReceipts.filter(r => {
        const d = new Date(r.date || r.receiptDate);
        return d.toDateString() === todayStr;
    }).length;

    // 2. Medicines
    const totalMedicines = products.length;
    const outOfStockCount = products.filter(p => p.track_stock && (parseInt(p.stock_quantity) || 0) <= 0).length;
    const expiredCount = useMemo(() => {
        const today = new Date();
        return products.filter(p => p.expiry_date && new Date(p.expiry_date) < today).length;
    }, [products]);

    // 3. Suppliers
    const suppliers = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('market_suppliers') || '[]');
        } catch {
            return [];
        }
    }, []);
    const totalSuppliersCount = suppliers.length;
    const todaySuppliers = suppliers.filter(s => {
        const d = new Date(s.createdAt || s.created_at);
        return d.toDateString() === todayStr;
    }).length;

    // 4. Invoices
    const totalInvoices = sales.length;
    const todayInvoices = sales.filter(s => new Date(s.paid_at || s.created_at).toDateString() === todayStr).length;
    const incompletePayments = sales.filter(s => s.payment_status === 'unpaid' || s.payment_method === 'debt').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full gap-3 text-slate-400 min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                <span className="font-bold">{isRTL ? 'بارکردن...' : 'Loading...'}</span>
            </div>
        );
    }

    // Grid of cards data
    const quickActions = [
        {
            title: 'New POS Sale',
            ckbTitle: 'فرۆشتنی نوێ (POS)',
            desc: 'New Point of Sale',
            ckbDesc: 'خاڵی فرۆشتنی نوێ',
            icon: Storefront,
            path: '/cashier'
        },
        {
            title: 'New Invoice',
            ckbTitle: 'وەسڵی نوێ',
            desc: 'Create and Email new Invoice to Customer',
            ckbDesc: 'دروستکردنی وەسڵی نوێ بۆ کڕیار',
            icon: FilePlus,
            path: '/cashier'
        },
        {
            title: 'New Medicine',
            ckbTitle: 'دەرمانی نوێ',
            desc: 'Add a new Medicine to the System',
            ckbDesc: 'زیادکردنی دەرمانی نوێ بۆ سیستەمەکە',
            icon: FirstAid,
            path: '/warehouse'
        },
        {
            title: 'New Customer',
            ckbTitle: 'کڕیاری نوێ',
            desc: 'Add new Customer to the System',
            ckbDesc: 'زیادکردنی کڕیاری نوێ بۆ سیستەمەکە',
            icon: UserPlus,
            path: '/admin/debts'
        },
        {
            title: 'Todays Report',
            ckbTitle: 'ڕاپۆرتی ئەمڕۆ',
            desc: 'Everything done today POS + Invoices',
            ckbDesc: 'کۆی کارەکانی ئەمڕۆ فرۆشتن + وەسڵەکان',
            icon: Coins,
            path: '/shift-reports'
        },
        {
            title: 'Suppliers Report',
            ckbTitle: 'ڕاپۆرتی دابینکەران',
            desc: 'All registered suppliers details',
            ckbDesc: 'تەواوی وردەکاری دابینکەرە تۆمارکراوەکان',
            icon: ClipboardText,
            path: '/suppliers'
        },
        {
            title: 'Stock Report',
            ckbTitle: 'ڕاپۆرتی کۆگا',
            desc: 'Stock analysis report',
            ckbDesc: 'ڕاپۆرت و شیکاری مەخزەن',
            icon: Warehouse,
            path: '/warehouse'
        },
        {
            title: 'Purchase Report',
            ckbTitle: 'ڕاپۆرتی کڕین',
            desc: 'All purchases done reports',
            ckbDesc: 'کۆی ڕاپۆرتەکانی کڕین لە دابینکەرانەوە',
            icon: ShoppingCart,
            path: '/incoming-medicines'
        }
    ];

    return (
        <AdminGuard>
            <div className="space-y-8 p-6 bg-[#f8f9fa] dark:bg-[#030712] min-h-screen text-slate-800 dark:text-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Stat cards row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Total Purchases */}
                    <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-850 p-6 rounded-lg shadow-sm flex items-start justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md">
                        <div className="space-y-1">
                            <div className="text-5xl font-light text-slate-800 dark:text-slate-200">{totalPurchases}</div>
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRTL ? 'کۆی کڕینەکان' : 'Total Purchases'}</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-550 font-bold">
                                {isRTL ? 'ئەمڕۆ' : 'Today'} <span className="text-red-500 font-black">{todayPurchases}</span>
                            </p>
                        </div>
                        <ShoppingCart size={54} className="text-slate-350 dark:text-slate-600 opacity-80" weight="light" />
                    </div>

                    {/* Card 2: Total Medicine */}
                    <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-850 p-6 rounded-lg shadow-sm flex items-start justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md">
                        <div className="space-y-1">
                            <div className="text-5xl font-light text-slate-800 dark:text-slate-200">{totalMedicines}</div>
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRTL ? 'کۆی دەرمانەکان' : 'Total Medicine'}</h3>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-450 dark:text-slate-550 font-bold">
                                <div>{isRTL ? 'بێ مەوجود' : 'Out of Stock'} <span className="text-red-500 font-black">{outOfStockCount}</span></div>
                                <div>{isRTL ? 'بەسەرچووەکان' : 'Expired'} <span className="text-red-500 font-black">{expiredCount}</span></div>
                            </div>
                        </div>
                        <Pill size={54} className="text-slate-350 dark:text-slate-600 opacity-80" weight="light" />
                    </div>

                    {/* Card 3: Total Suppliers */}
                    <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-850 p-6 rounded-lg shadow-sm flex items-start justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md">
                        <div className="space-y-1">
                            <div className="text-5xl font-light text-slate-800 dark:text-slate-200">{totalSuppliersCount}</div>
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRTL ? 'کۆی دابینکەران' : 'Total Suppliers'}</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-550 font-bold">
                                {isRTL ? 'ئەمڕۆ' : 'Today'} <span className="text-red-500 font-black">{todaySuppliers}</span>
                            </p>
                        </div>
                        <Truck size={54} className="text-slate-350 dark:text-slate-600 opacity-80" weight="light" />
                    </div>

                    {/* Card 4: Total Invoices */}
                    <div className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-850 p-6 rounded-lg shadow-sm flex items-start justify-between relative overflow-hidden transition-all duration-200 hover:shadow-md">
                        <div className="space-y-1">
                            <div className="text-5xl font-light text-slate-800 dark:text-slate-200">{totalInvoices}</div>
                            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{isRTL ? 'کۆی وەسڵەکان' : 'Total Invoices'}</h3>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-450 dark:text-slate-550 font-bold">
                                <div>{isRTL ? 'ئەمڕۆ' : 'Today'} <span className="text-red-500 font-black">{todayInvoices}</span></div>
                                <div>{isRTL ? 'قەرزی ماوە' : 'Incomplete Payments'} <span className="text-red-500 font-black">{incompletePayments}</span></div>
                            </div>
                        </div>
                        <Receipt size={54} className="text-slate-350 dark:text-slate-600 opacity-80" weight="light" />
                    </div>
                </div>

                {/* Quick actions grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action, i) => {
                        const Icon = action.icon;
                        return (
                            <div
                                key={i}
                                onClick={() => navigate(action.path)}
                                className="bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-850 p-8 rounded-lg shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 hover:shadow-md group active:scale-[0.98]"
                            >
                                <Icon size={44} className="text-slate-500 dark:text-slate-400 group-hover:text-emerald-500 transition-colors duration-200 mb-4" />
                                <div className="border border-emerald-600 dark:border-emerald-500 rounded px-5 py-2 mb-3 bg-white dark:bg-slate-900 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/20 transition-all duration-200">
                                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                                        {isRTL ? action.ckbTitle : action.title}
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-450 dark:text-slate-500 leading-tight">
                                    {isRTL ? action.ckbDesc : action.desc}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Footer text */}
                <div className="pt-8 pb-4 text-center border-t border-slate-200 dark:border-slate-850/40">
                    <p className="text-xs text-slate-400 dark:text-slate-550 font-medium">
                        Developed By George Wainaina | Swagfin Inc | +254705 418 696
                    </p>
                </div>
            </div>
        </AdminGuard>
    );
};

export default DashboardPage;
