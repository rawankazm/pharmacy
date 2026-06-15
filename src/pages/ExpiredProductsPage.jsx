import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    CalendarBlank, WarningCircle, Trash, Check, ArrowRight,
    MagnifyingGlass, Funnel, ArrowClockwise, CurrencyDollar,
    Package, PencilSimple, Hourglass, ShieldCheck, X
} from '@phosphor-icons/react';
import AdminGuard from '../components/AdminGuard';
import { fetchProducts, updateProduct, createExpense } from '../api';

const ExpiredProductsPage = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'expired' | 'soon' | 'safe'
    
    // Write off modal states
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [writeOffQty, setWriteOffQty] = useState('');
    const [writeOffCost, setWriteOffCost] = useState('');
    const [writeOffReason, setWriteOffReason] = useState('بەسەرچوون'); // default reason

    // Edit Expiry Modal states
    const [editingProduct, setEditingProduct] = useState(null);
    const [newExpiryDate, setNewExpiryDate] = useState('');

    const loadData = async () => {
        setLoading(true);
        try {
            const { data } = await fetchProducts();
            setProducts(data || []);
        } catch (error) {
            console.error(error);
            toast.error('هەڵەیەک لە بارکردنی بەرهەمەکان ڕوویدا');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Date computation helpers
    const getExpiryStatus = (expiryDate) => {
        if (!expiryDate) return { status: 'safe', label: 'دیاری نەکراوە', color: 'slate', daysLeft: null };

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const exp = new Date(expiryDate);
        exp.setHours(0, 0, 0, 0);

        const diffTime = exp - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { status: 'expired', label: 'بەسەرچووە', color: 'red', daysLeft: diffDays };
        } else if (diffDays <= 30) {
            return { status: 'soon', label: `ڕیکۆرد ${diffDays} ڕۆژ`, color: 'amber', daysLeft: diffDays };
        } else {
            return { status: 'safe', label: 'سەلامەتە', color: 'emerald', daysLeft: diffDays };
        }
    };

    // Stats calculations
    const stats = useMemo(() => {
        let expired = 0;
        let soon = 0;
        let safe = 0;

        products.forEach(p => {
            if (p.expiry_date) {
                const info = getExpiryStatus(p.expiry_date);
                if (info.status === 'expired') expired++;
                else if (info.status === 'soon') soon++;
                else safe++;
            } else {
                safe++;
            }
        });

        return { expired, soon, safe, total: products.length };
    }, [products]);

    // Filtered Products
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const nameMatch = (p.name_ckb || p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                              (p.barcode || '').includes(searchQuery);
            
            if (!nameMatch) return false;

            if (statusFilter === 'all') return true;
            const info = getExpiryStatus(p.expiry_date);
            return info.status === statusFilter;
        });
    }, [products, searchQuery, statusFilter]);

    // Update Expiry Date Action
    const handleUpdateExpiry = async (e) => {
        e.preventDefault();
        if (!editingProduct) return;

        try {
            const { error } = await updateProduct(editingProduct.id, { expiry_date: newExpiryDate });
            if (error) throw new Error(error);

            toast.success('ڕێکەوتی بەسەرچوون بە سەرکەوتوویی تازەکرایەوە');
            setEditingProduct(null);
            loadData();
        } catch (error) {
            toast.error('کێشەیەک لە نوێکردنەوەی ڕێکەوت ڕوویدا');
        }
    };

    // Open Write Off modal
    const openWriteOff = (p) => {
        setSelectedProduct(p);
        setWriteOffQty(p.stock_quantity || '1');
        setWriteOffCost(p.price || '0');
        setWriteOffReason('بەسەرچوون');
    };

    // Execute Write Off (Stock reduction + Expense log)
    const handleWriteOff = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return;

        const qty = parseInt(writeOffQty);
        const cost = parseFloat(writeOffCost);

        if (isNaN(qty) || qty <= 0) {
            toast.error('بڕی دیاریکراو دروست نییە');
            return;
        }

        const lossAmount = qty * cost;

        try {
            // 1. Update stock
            const newStock = Math.max(0, (selectedProduct.stock_quantity || 0) - qty);
            await updateProduct(selectedProduct.id, { stock_quantity: newStock });

            // 2. Create waste expense
            const expenseDesc = `خەسارکردنی (${qty}) دانە لە بەرهەمی [${selectedProduct.name_ckb || selectedProduct.name}] - بەهۆی ${writeOffReason}`;
            await createExpense({
                description: expenseDesc,
                amount: lossAmount,
                category: 'Waste / خەسارکردن'
            });

            toast.success('بەرهەمەکە وەک خەسار تۆمارکرا و لە کۆگا کەمکرایەوە');
            setSelectedProduct(null);
            loadData();
        } catch (error) {
            console.error(error);
            toast.error('کێشەیەک لە تۆمارکردنی خەساردا ڕوویدا');
        }
    };

    return (
        <AdminGuard>
            <div className="space-y-5 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* Header */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                            <Hourglass size={22} weight="duotone" className="text-rose-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">کاڵا بەسەرچووەکان</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">بەدواداچوون بۆ ڕێکەوتی بەسەرچوونی بەرهەمەکان و خەسارکردن</p>
                        </div>
                    </div>
                    <button
                        onClick={loadData}
                        className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all"
                        title="تازەکردنەوە"
                    >
                        <ArrowClockwise size={18} />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-5 rounded-2xl border border-red-200/50 dark:border-red-950/30 flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.expired}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">بەسەرچووەکان</p>
                        </div>
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-500">
                            <WarningCircle size={24} weight="duotone" />
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-amber-200/50 dark:border-amber-950/30 flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.soon}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">نزیک لە بەسەرچوون (ژێر ٣٠ ڕۆژ)</p>
                        </div>
                        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-xl flex items-center justify-center text-amber-500">
                            <Hourglass size={24} weight="duotone" />
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-950/30 flex items-center justify-between">
                        <div>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.safe}</p>
                            <p className="text-xs font-bold text-slate-500 mt-1">سەلامەت و بێ کێشە</p>
                        </div>
                        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-500">
                            <ShieldCheck size={24} weight="duotone" />
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:w-80">
                        <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                            <MagnifyingGlass size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="گەڕان بەپێی بەرهەم یان بارکۆد..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:bg-white focus:border-rose-500 transition-all dark:text-white"
                        />
                    </div>
                    
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 w-full sm:w-auto overflow-x-auto">
                        {[
                            { id: 'all', label: 'هەموو' },
                            { id: 'expired', label: 'بەسەرچوو' },
                            { id: 'soon', label: 'نزیک لە بەسەرچوون' },
                            { id: 'safe', label: 'سەلامەت' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex-1 sm:flex-initial ${statusFilter === tab.id ? 'bg-white dark:bg-slate-700 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Expiry Grid/Table */}
                <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-slate-350 dark:text-slate-650 gap-2">
                            <CalendarBlank size={64} weight="duotone" />
                            <p className="font-bold text-sm">هیچ بەرهەمێک نەدۆزرایەوە</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10 text-slate-550 text-xs font-bold">
                                        <th className="p-4">بەرهەم</th>
                                        <th className="p-4">بارکۆد</th>
                                        <th className="p-4">مەوجود لە کۆگا</th>
                                        <th className="p-4">ڕێکەوتی بەسەرچوون</th>
                                        <th className="p-4">بارودۆخ</th>
                                        <th className="p-4 text-left">کردارەکان</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm">
                                    {filteredProducts.map(p => {
                                        const expiryInfo = getExpiryStatus(p.expiry_date);
                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-800 dark:text-slate-150">{p.name_ckb || p.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{p.category}</p>
                                                </td>
                                                <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                                                    {p.barcode || '—'}
                                                </td>
                                                <td className="p-4 font-bold">
                                                    <span className={p.stock_quantity <= 0 ? 'text-red-500' : 'text-slate-700 dark:text-slate-350'}>
                                                        {p.stock_quantity || 0} {p.description === 'carton' ? 'کارتۆن' : 'دانە'}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                                                    {p.expiry_date ? new Date(p.expiry_date).toLocaleDateString('ckb') : 'دیاری نەکراوە'}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold bg-${expiryInfo.color}-50 text-${expiryInfo.color}-600 dark:bg-${expiryInfo.color}-950/20 dark:text-${expiryInfo.color}-400`}>
                                                        {expiryInfo.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-left flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingProduct(p);
                                                            setNewExpiryDate(p.expiry_date || '');
                                                        }}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg transition-all"
                                                        title="دەستکاریکردنی ڕێکەوت"
                                                    >
                                                        <PencilSimple size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => openWriteOff(p)}
                                                        className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all flex items-center gap-1"
                                                        title="تۆمارکردن وەک خەسار"
                                                    >
                                                        <Trash size={15} />
                                                        تۆماری خەسار
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Edit Expiry Modal */}
                {editingProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="absolute top-4 left-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                            >
                                <X size={16} />
                            </button>
                            
                            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4">ڕێکەوتی بەسەرچوونی بەرهەم</h3>
                            
                            <form onSubmit={handleUpdateExpiry} className="space-y-4">
                                <div className="text-xs p-3 bg-slate-50 dark:bg-slate-900 rounded-xl mb-2">
                                    <p className="font-black text-slate-700 dark:text-slate-350">{editingProduct.name_ckb || editingProduct.name}</p>
                                    <p className="text-slate-400 mt-1">بارکۆد: {editingProduct.barcode || '—'}</p>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">ڕێکەوتی بەسەرچوونی نوێ</label>
                                    <input
                                        type="date"
                                        value={newExpiryDate}
                                        onChange={e => setNewExpiryDate(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-rose-500 dark:text-white"
                                        required
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/10"
                                    >
                                        تازەکردنەوە
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingProduct(null)}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-black transition-all"
                                    >
                                        پاشگەزبوونەوە
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Write Off Modal */}
                {selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative">
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="absolute top-4 left-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400"
                            >
                                <X size={16} />
                            </button>
                            
                            <h3 className="text-base font-black text-rose-650 dark:text-rose-400 mb-4 flex items-center gap-1.5">
                                <Trash size={18} />
                                تۆمارکردنی زیان و خەسار
                            </h3>
                            
                            <form onSubmit={handleWriteOff} className="space-y-4">
                                <div className="text-xs p-3 bg-rose-50/50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/10 rounded-xl mb-2">
                                    <p className="font-black text-slate-700 dark:text-slate-300">{selectedProduct.name_ckb || selectedProduct.name}</p>
                                    <p className="text-slate-400 mt-1">مەوجود لە کۆگا: {selectedProduct.stock_quantity || 0} دانە</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">بڕی خەساربوو</label>
                                        <input
                                            type="number"
                                            value={writeOffQty}
                                            onChange={e => setWriteOffQty(e.target.value)}
                                            min="1"
                                            max={selectedProduct.stock_quantity || 1}
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-rose-500 dark:text-white"
                                            required
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400">تێچوو/دانە (د.ع)</label>
                                        <input
                                            type="number"
                                            value={writeOffCost}
                                            onChange={e => setWriteOffCost(e.target.value)}
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-rose-500 dark:text-white"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400">مەبەست یان هۆکار</label>
                                    <select
                                        value={writeOffReason}
                                        onChange={e => setWriteOffReason(e.target.value)}
                                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:border-rose-500 dark:text-white"
                                    >
                                        <option value="بەسەرچوون">بەسەرچوونی ڕێکەوت (Expired)</option>
                                        <option value="خراپبوون/شکاندن">خراپبوون یان شکاندن (Damaged)</option>
                                        <option value="دیارنەمان">سەروو مەسروفات / دیارنەمان (Missing)</option>
                                        <option value="تر">تر (Other)</option>
                                    </select>
                                </div>

                                <div className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 p-2.5 rounded-lg text-center">
                                    کۆی زیان: {((parseInt(writeOffQty) || 0) * (parseFloat(writeOffCost) || 0)).toLocaleString()} د.ع
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        type="submit"
                                        className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-rose-600/10"
                                    >
                                        تۆمارکردنی خەسار
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProduct(null)}
                                        className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-black transition-all"
                                    >
                                        پاشگەزبوونەوە
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AdminGuard>
    );
};

export default ExpiredProductsPage;
