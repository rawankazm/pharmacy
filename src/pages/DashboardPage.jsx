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

    const cardThemes = [
        { color: 'emerald', border: 'border-emerald-500/30', bg: 'bg-emerald-50/10', text: 'text-emerald-600 dark:text-emerald-400', hoverBg: 'hover:bg-emerald-500', shadow: 'hover:shadow-[0_10px_25px_rgba(16,185,129,0.12)] hover:border-emerald-500/40', iconColor: 'text-emerald-500' },
        { color: 'blue', border: 'border-blue-500/30', bg: 'bg-blue-50/10', text: 'text-blue-600 dark:text-blue-400', hoverBg: 'hover:bg-blue-500', shadow: 'hover:shadow-[0_10px_25px_rgba(59,130,246,0.12)] hover:border-blue-500/40', iconColor: 'text-blue-500' },
        { color: 'teal', border: 'border-teal-500/30', bg: 'bg-teal-50/10', text: 'text-teal-600 dark:text-teal-400', hoverBg: 'hover:bg-teal-500', shadow: 'hover:shadow-[0_10px_25px_rgba(20,184,166,0.12)] hover:border-teal-500/40', iconColor: 'text-teal-500' },
        { color: 'indigo', border: 'border-indigo-500/30', bg: 'bg-indigo-50/10', text: 'text-indigo-600 dark:text-indigo-400', hoverBg: 'hover:bg-indigo-500', shadow: 'hover:shadow-[0_10px_25px_rgba(99,102,241,0.12)] hover:border-indigo-500/40', iconColor: 'text-indigo-500' },
        { color: 'amber', border: 'border-amber-500/30', bg: 'bg-amber-50/10', text: 'text-amber-600 dark:text-amber-450', hoverBg: 'hover:bg-amber-500', shadow: 'hover:shadow-[0_10px_25px_rgba(245,158,11,0.12)] hover:border-amber-500/40', iconColor: 'text-amber-500' },
        { color: 'purple', border: 'border-purple-500/30', bg: 'bg-purple-50/10', text: 'text-purple-600 dark:text-purple-400', hoverBg: 'hover:bg-purple-500', shadow: 'hover:shadow-[0_10px_25px_rgba(168,85,247,0.12)] hover:border-purple-500/40', iconColor: 'text-purple-500' },
        { color: 'cyan', border: 'border-cyan-500/30', bg: 'bg-cyan-50/10', text: 'text-cyan-600 dark:text-cyan-400', hoverBg: 'hover:bg-cyan-500', shadow: 'hover:shadow-[0_10px_25px_rgba(6,182,212,0.12)] hover:border-cyan-500/40', iconColor: 'text-cyan-500' },
        { color: 'pink', border: 'border-pink-500/30', bg: 'bg-pink-50/10', text: 'text-pink-600 dark:text-pink-400', hoverBg: 'hover:bg-pink-500', shadow: 'hover:shadow-[0_10px_25px_rgba(236,72,153,0.12)] hover:border-pink-500/40', iconColor: 'text-pink-500' }
    ];

    return (
        <AdminGuard>
            <div className="space-y-8 p-6 bg-[#f8f9fa] dark:bg-[#030712] min-h-screen text-slate-800 dark:text-slate-100" dir={isRTL ? 'rtl' : 'ltr'}>
                {/* Stat cards row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Card 1: Total Purchases */}
                    <div className="bg-white/90 dark:bg-[#0b1329]/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-sm flex items-start justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="space-y-1">
                            <div className="text-5xl font-light text-slate-800 dark:text-slate-100 tracking-tight">{totalPurchases}</div>
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">{isRTL ? 'کۆی کڕینەکان' : 'Total Purchases'}</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-550 font-bold">
                                {isRTL ? 'ئەمڕۆ' : 'Today'} <span className="text-red-500 font-black">{todayPurchases}</span>
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500/20 to-indigo-500/5 text-indigo-500 border border-indigo-500/10 flex items-center justify-center shadow-inner">
                            <ShoppingCart size={28} weight="duotone" />
                        </div>
                    </div>

                    {/* Card 2: Total Medicine */}
                    <div className="bg-white/90 dark:bg-[#0b1329]/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-sm flex items-start justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="space-y-1">
                            <div className="text-5xl font-light text-slate-800 dark:text-slate-100 tracking-tight">{totalMedicines}</div>
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">{isRTL ? 'کۆی دەرمانەکان' : 'Total Medicine'}</h3>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-450 dark:text-slate-550 font-bold">
                                <div>{isRTL ? 'بێ مەوجود' : 'Out of Stock'} <span className="text-red-500 font-black">{outOfStockCount}</span></div>
                                <div>{isRTL ? 'بەسەرچووەکان' : 'Expired'} <span className="text-red-500 font-black">{expiredCount}</span></div>
                            </div>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/5 text-emerald-500 border border-emerald-500/10 flex items-center justify-center shadow-inner">
                            <Pill size={28} weight="duotone" />
                        </div>
                    </div>

                    {/* Card 3: Total Suppliers */}
                    <div className="bg-white/90 dark:bg-[#0b1329]/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-sm flex items-start justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="space-y-1">
                            <div className="text-5xl font-light text-slate-800 dark:text-slate-100 tracking-tight">{totalSuppliersCount}</div>
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">{isRTL ? 'کۆی دابینکەران' : 'Total Suppliers'}</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-550 font-bold">
                                {isRTL ? 'ئەمڕۆ' : 'Today'} <span className="text-red-500 font-black">{todaySuppliers}</span>
                            </p>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500/20 to-orange-500/5 text-amber-500 border border-amber-500/10 flex items-center justify-center shadow-inner">
                            <Truck size={28} weight="duotone" />
                        </div>
                    </div>

                    {/* Card 4: Total Invoices */}
                    <div className="bg-white/90 dark:bg-[#0b1329]/95 backdrop-blur-md border border-slate-200/60 dark:border-slate-800/60 p-6 rounded-xl shadow-sm flex items-start justify-between relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="space-y-1">
                            <div className="text-5xl font-light text-slate-800 dark:text-slate-100 tracking-tight">{totalInvoices}</div>
                            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">{isRTL ? 'کۆی وەسڵەکان' : 'Total Invoices'}</h3>
                            <div className="flex flex-col gap-0.5 text-xs text-slate-450 dark:text-slate-550 font-bold">
                                <div>{isRTL ? 'ئەمڕۆ' : 'Today'} <span className="text-red-500 font-black">{todayInvoices}</span></div>
                                <div>{isRTL ? 'قەرزی ماوە' : 'Incomplete Payments'} <span className="text-red-500 font-black">{incompletePayments}</span></div>
                            </div>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500/20 to-pink-500/5 text-rose-500 border border-rose-500/10 flex items-center justify-center shadow-inner">
                            <Receipt size={28} weight="duotone" />
                        </div>
                    </div>
                </div>

                {/* Quick actions grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {quickActions.map((action, i) => {
                        const Icon = action.icon;
                        const theme = cardThemes[i % cardThemes.length];
                        return (
                            <div
                                key={i}
                                onClick={() => navigate(action.path)}
                                className={`bg-white/90 dark:bg-[#0b1329]/90 backdrop-blur-md border border-slate-200/60 dark:border-slate-850 p-8 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 hover:-translate-y-1.5 active:scale-[0.98] group ${theme.shadow}`}
                            >
                                <Icon size={46} className={`${theme.iconColor} opacity-90 group-hover:scale-110 transition-transform duration-300 mb-5`} />
                                <div className={`border-2 ${theme.border} ${theme.bg} rounded-full px-6 py-2 mb-3 transition-all duration-300 group-hover:text-white ${theme.hoverBg} shadow-sm`}>
                                    <span className={`font-bold text-[13px] uppercase tracking-wide transition-colors duration-200 group-hover:text-white ${theme.text}`}>
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
                <div className="pt-8 pb-4 text-center border-t border-slate-200/50 dark:border-slate-850/30">
                    <p className="text-xs text-slate-400 dark:text-slate-550 font-medium">
                        Developed By George Wainaina | Swagfin Inc | +254705 418 696
                    </p>
                </div>
            </div>
        </AdminGuard>
    );
};

export default DashboardPage;
