import React, { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { fetchProducts, updateProduct } from '../api';
import AdminGuard from '../components/AdminGuard';
import {
    Package, Plus, Minus, MagnifyingGlass, Funnel, ArrowsClockwise,
    WarningCircle, CheckCircle, XCircle, CaretUp, CaretDown,
    ClockCounterClockwise, X, Barcode, ArrowUp, ArrowDown,
    Warehouse, ChartBar, ArrowCircleUp, ArrowCircleDown, Scales,
    SortAscending, List, SquaresFour
} from '@phosphor-icons/react';

// ─── Helpers ────────────────────────────────────────────────────────────────
const MOVEMENTS_KEY = 'warehouseMovements';

const getMovements = () => {
    try { return JSON.parse(localStorage.getItem(MOVEMENTS_KEY) || '[]'); }
    catch { return []; }
};

const saveMovement = (entry) => {
    try {
        const list = getMovements();
        list.unshift(entry); // newest first
        // Keep last 500
        if (list.length > 500) list.length = 500;
        localStorage.setItem(MOVEMENTS_KEY, JSON.stringify(list));
    } catch { /* storage full */ }
};

const stockStatus = (qty) => {
    if (qty === 0 || qty === null || qty === undefined) return 'empty';
    if (qty < 10) return 'low';
    return 'good';
};

const statusConfig = {
    empty: { label: 'بێ مەوجود', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500' },
    low:   { label: 'کورتە',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500' },
    good:  { label: 'باشە',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500' },
};

const UNIT_LABELS = { piece: 'دانە', carton: 'کارتۆن', kilo: 'کیلۆ', pack: 'پاکێت' };

const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('ckb-IQ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// ─── Stock Adjust Modal ──────────────────────────────────────────────────────
const AdjustModal = ({ product, mode, onClose, onSave }) => {
    const [qty, setQty] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);

    const isIn = mode === 'in';
    const current = product?.stock_quantity ?? 0;
    const previewQty = isIn
        ? current + (parseInt(qty) || 0)
        : Math.max(0, current - (parseInt(qty) || 0));

    const handleSave = async () => {
        const amount = parseInt(qty);
        if (!amount || amount <= 0) { toast.error('تکایە بڕێکی دروست بنووسە'); return; }
        if (!isIn && amount > current) { toast.error('بڕ زیاترە لە موەجودی ئێستا'); return; }
        setLoading(true);
        await onSave(product, previewQty, amount, mode, note);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-slate-800/60 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-5 ${isIn ? 'bg-emerald-500' : 'bg-amber-500'} text-white`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {isIn
                                ? <ArrowCircleUp size={28} weight="duotone" />
                                : <ArrowCircleDown size={28} weight="duotone" />
                            }
                            <div>
                                <h2 className="text-lg font-black">{isIn ? 'زیادکردنی مەوجود' : 'کەمکردنەوەی مەوجود'}</h2>
                                <p className="text-sm opacity-80 truncate max-w-[220px]">{product?.name_ckb || product?.name}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Current vs Preview */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">موەجودی ئێستا</p>
                            <p className="text-3xl font-black text-slate-800 dark:text-slate-100">{current}</p>
                            <p className="text-xs text-slate-400 mt-1">{UNIT_LABELS[product?.description] || 'دانە'}</p>
                        </div>
                        <div className={`rounded-xl p-4 text-center ${isIn ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1">دوای گۆڕان</p>
                            <p className={`text-3xl font-black ${isIn ? 'text-emerald-600' : 'text-amber-600'}`}>{previewQty}</p>
                            <p className="text-xs text-slate-400 mt-1">{UNIT_LABELS[product?.description] || 'دانە'}</p>
                        </div>
                    </div>

                    {/* Quantity Input */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            بڕی {isIn ? 'زیادکراو' : 'کەمکراو'}
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setQty(v => String(Math.max(1, (parseInt(v) || 0) - 1)))}
                                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                            >
                                <Minus size={18} />
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={qty}
                                onChange={e => setQty(e.target.value)}
                                placeholder="0"
                                autoFocus
                                className="flex-1 text-center text-2xl font-black bg-slate-50 dark:bg-slate-800/60 border-2 border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 dark:focus:border-emerald-500 text-slate-800 dark:text-slate-100 transition-colors"
                            />
                            <button
                                onClick={() => setQty(v => String((parseInt(v) || 0) + 1))}
                                className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                        {/* Quick amounts */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {[5, 10, 24, 48, 100].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setQty(String(n))}
                                    className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-slate-600 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                                >
                                    +{n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تێبینی (ئارەزوومەندانە)</label>
                        <input
                            type="text"
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="وەک: پوشاندنی ستۆک، گەیشتنی کاڵا..."
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-emerald-500 text-sm text-slate-700 dark:text-slate-300 transition-colors"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        پاشگەزبوون
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className={`flex-1 py-3 rounded-xl font-black text-white transition-all ${isIn ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'} disabled:opacity-50`}
                    >
                        {loading ? 'جێبەجێکردن...' : 'پشتگیری'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Movement History Panel ──────────────────────────────────────────────────
const MovementHistory = ({ movements, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
            className="relative bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-slate-200/60 dark:border-slate-800/60"
            onClick={e => e.stopPropagation()}
        >
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ClockCounterClockwise size={24} weight="duotone" className="text-emerald-500" />
                    <h2 className="text-lg font-black text-slate-800 dark:text-slate-100">مێژووی موەجود</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
                    <X size={20} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {movements.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <ClockCounterClockwise size={48} weight="duotone" />
                        <p className="font-bold">هیچ مێژووێک نییە هێشتا</p>
                    </div>
                ) : movements.map((m, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${m.type === 'in' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'}`}>
                            {m.type === 'in' ? <ArrowUp size={18} weight="bold" /> : <ArrowDown size={18} weight="bold" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{m.productName}</p>
                            {m.note && <p className="text-xs text-slate-400 truncate">{m.note}</p>}
                        </div>
                        <div className="text-left flex-shrink-0">
                            <p className={`font-black text-sm ${m.type === 'in' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {m.type === 'in' ? '+' : '-'}{m.amount}
                            </p>
                            <p className="text-[10px] text-slate-400">{formatDate(m.date)}</p>
                        </div>
                        <div className="text-left flex-shrink-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400">باڵانس</p>
                            <p className="font-black text-sm text-slate-700 dark:text-slate-300">{m.newQty}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ─── Main Page ───────────────────────────────────────────────────────────────
const WarehousePage = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

    const [adjustModal, setAdjustModal] = useState(null); // { product, mode: 'in'|'out' }
    const [showHistory, setShowHistory] = useState(false);
    const [movements, setMovements] = useState([]);

    // Load products
    const loadProducts = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await fetchProducts();
            if (data) {
                setProducts(data.filter(p => p.track_stock !== false));
            }
        } catch (e) {
            toast.error('هەڵە لە بارکردنی بەرهەمەکان');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadProducts(); }, [loadProducts]);
    useEffect(() => { setMovements(getMovements()); }, []);

    // Categories list
    const categories = useMemo(() => {
        const cats = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
        return cats;
    }, [products]);

    // Stats
    const stats = useMemo(() => {
        const tracked = products;
        return {
            total: tracked.length,
            totalUnits: tracked.reduce((sum, p) => sum + (parseInt(p.stock_quantity) || 0), 0),
            low: tracked.filter(p => stockStatus(parseInt(p.stock_quantity)) === 'low').length,
            empty: tracked.filter(p => stockStatus(parseInt(p.stock_quantity)) === 'empty').length,
        };
    }, [products]);

    // Filter + sort
    const filtered = useMemo(() => {
        let list = [...products];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name?.toLowerCase().includes(q) ||
                p.name_ckb?.includes(q) ||
                p.barcode?.includes(q)
            );
        }
        if (categoryFilter !== 'all') list = list.filter(p => p.category === categoryFilter);
        if (statusFilter !== 'all') list = list.filter(p => stockStatus(parseInt(p.stock_quantity)) === statusFilter);

        list.sort((a, b) => {
            let av, bv;
            switch (sortBy) {
                case 'stock': av = parseInt(a.stock_quantity) || 0; bv = parseInt(b.stock_quantity) || 0; break;
                case 'price': av = parseFloat(a.price) || 0; bv = parseFloat(b.price) || 0; break;
                case 'category': av = a.category || ''; bv = b.category || ''; break;
                default: av = (a.name_ckb || a.name || '').toLowerCase(); bv = (b.name_ckb || b.name || '').toLowerCase();
            }
            return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
        });

        return list;
    }, [products, search, categoryFilter, statusFilter, sortBy, sortDir]);

    // Handle adjust save
    const handleAdjustSave = async (product, newQty, amount, type, note) => {
        const { error } = await updateProduct(product.id, { stock_quantity: newQty });
        if (error) { toast.error('هەڵە لە نوێکردنەوە'); return; }

        // Save movement log
        saveMovement({
            productId: product.id,
            productName: product.name_ckb || product.name,
            type,
            amount,
            newQty,
            note,
            date: new Date().toISOString(),
        });

        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: newQty } : p));
        setMovements(getMovements());
        toast.success(type === 'in' ? `✅ +${amount} زیادکرا` : `📤 ${amount}- کەمکرایەوە`);
        setAdjustModal(null);
    };

    const toggleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortDir('asc'); }
    };

    const SortIcon = ({ field }) => {
        if (sortBy !== field) return <CaretDown size={12} className="text-slate-300" />;
        return sortDir === 'asc' ? <CaretUp size={12} className="text-emerald-500" /> : <CaretDown size={12} className="text-emerald-500" />;
    };

    return (
        <AdminGuard>
            <div className="flex flex-col h-full gap-4 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* ── Page Header ── */}
                <div className="glass-panel p-4 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-4 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Warehouse size={22} weight="duotone" className="text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">کۆگا</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">بەڕێوەبردنی موەجودی مارکێت</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setShowHistory(true); setMovements(getMovements()); }}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm font-bold"
                        >
                            <ClockCounterClockwise size={16} />
                            <span className="hidden sm:inline">مێژوو</span>
                        </button>
                        <button
                            onClick={loadProducts}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-sm font-bold"
                        >
                            <ArrowsClockwise size={16} />
                        </button>
                    </div>
                </div>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 flex-shrink-0">
                    {[
                        { label: 'کۆی بەرهەمەکان', value: stats.total, icon: Package, color: 'emerald' },
                        { label: 'کۆی یەکەکان', value: stats.totalUnits.toLocaleString(), icon: ChartBar, color: 'blue' },
                        { label: 'ستۆکی کورت', value: stats.low, icon: WarningCircle, color: 'amber' },
                        { label: 'بێ مەوجود', value: stats.empty, icon: XCircle, color: 'red' },
                    ].map((s, i) => (
                        <div key={i} className="glass-panel rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3 hover-lift">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-${s.color}-100 dark:bg-${s.color}-900/30 flex-shrink-0`}>
                                <s.icon size={22} weight="duotone" className={`text-${s.color}-500`} />
                            </div>
                            <div>
                                <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{s.value}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Search + Filters ── */}
                <div className="glass-panel p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-3 items-center flex-shrink-0">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <MagnifyingGlass size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="گەڕان بە ناو یان باڕکۆد..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full ps-9 pe-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors text-slate-700 dark:text-slate-300"
                        />
                    </div>

                    {/* Category filter */}
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                        <option value="all">هەموو کاتیگۆریەکان</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                        <option value="all">هەموو ئێستاکان</option>
                        <option value="good">باشە ✅</option>
                        <option value="low">کورتە ⚠️</option>
                        <option value="empty">بێ مەوجود ❌</option>
                    </select>

                    {/* View toggle */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <SquaresFour size={16} />
                        </button>
                    </div>

                    <span className="text-xs text-slate-400 font-bold hidden md:inline">{filtered.length} بەرهەم</span>
                </div>

                {/* ── Main Content ── */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full gap-3 text-slate-400">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
                            <span className="font-bold">بارکردن...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
                            <Package size={56} weight="duotone" className="text-slate-300 dark:text-slate-700" />
                            <p className="text-lg font-black">هیچ بەرهەمێک نەدۆزرایەوە</p>
                            <p className="text-sm">گۆڕانکاری لە فلتەرەکان بکە</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        /* ── Table View ── */
                        <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                                            {[
                                                { label: 'بەرهەم', field: 'name' },
                                                { label: 'کاتیگۆری', field: 'category' },
                                                { label: 'باڕکۆد', field: null },
                                                { label: 'نرخ', field: 'price' },
                                                { label: 'موەجود', field: 'stock' },
                                                { label: 'ئێستا', field: null },
                                                { label: 'کردارەکان', field: null },
                                            ].map((h, i) => (
                                                <th
                                                    key={i}
                                                    onClick={h.field ? () => toggleSort(h.field) : undefined}
                                                    className={`px-4 py-3 text-start text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap ${h.field ? 'cursor-pointer hover:text-emerald-600 select-none' : ''}`}
                                                >
                                                    <div className="flex items-center gap-1">
                                                        {h.label}
                                                        {h.field && <SortIcon field={h.field} />}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                        {filtered.map(p => {
                                            const qty = parseInt(p.stock_quantity) ?? 0;
                                            const status = stockStatus(qty);
                                            const sc = statusConfig[status];
                                            return (
                                                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                                    {/* Product */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                                                                {p.image_url && p.image_url !== '__local_image__' ? (
                                                                    <img src={p.image_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <Package size={18} className="text-slate-400" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">{p.name_ckb || p.name}</p>
                                                                <p className="text-xs text-slate-400">{p.name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Category */}
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">{p.category}</span>
                                                    </td>
                                                    {/* Barcode */}
                                                    <td className="px-4 py-3">
                                                        <span className="text-xs font-mono text-slate-400">{p.barcode || '—'}</span>
                                                    </td>
                                                    {/* Price */}
                                                    <td className="px-4 py-3">
                                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{Number(p.price).toLocaleString()} د.ع</span>
                                                    </td>
                                                    {/* Stock */}
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{qty}</span>
                                                            <span className="text-xs text-slate-400 ms-1">{UNIT_LABELS[p.description] || 'دانە'}</span>
                                                        </div>
                                                    </td>
                                                    {/* Status */}
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black ${sc.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                            {sc.label}
                                                        </span>
                                                    </td>
                                                    {/* Actions */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => setAdjustModal({ product: p, mode: 'in' })}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-colors"
                                                                title="زیادکردن"
                                                            >
                                                                <Plus size={13} weight="bold" />
                                                                داخل
                                                            </button>
                                                            <button
                                                                onClick={() => setAdjustModal({ product: p, mode: 'out' })}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-black transition-colors"
                                                                title="کەمکردنەوە"
                                                            >
                                                                <Minus size={13} weight="bold" />
                                                                دەرچوون
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        /* ── Grid View ── */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-4">
                            {filtered.map(p => {
                                const qty = parseInt(p.stock_quantity) ?? 0;
                                const status = stockStatus(qty);
                                const sc = statusConfig[status];
                                return (
                                    <div key={p.id} className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden hover-lift group">
                                        {/* Image */}
                                        <div className="relative h-32 bg-slate-100 dark:bg-slate-800">
                                            {p.image_url && p.image_url !== '__local_image__' ? (
                                                <img src={p.image_url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package size={36} className="text-slate-300 dark:text-slate-600" />
                                                </div>
                                            )}
                                            <span className={`absolute top-2 end-2 px-2 py-0.5 rounded-full text-[10px] font-black ${sc.color}`}>
                                                {sc.label}
                                            </span>
                                        </div>
                                        {/* Info */}
                                        <div className="p-3">
                                            <p className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight truncate">{p.name_ckb || p.name}</p>
                                            <p className="text-xs text-slate-400 truncate mb-2">{p.category}</p>
                                            <div className="flex items-baseline gap-1 mb-3">
                                                <span className="text-3xl font-black text-slate-800 dark:text-slate-100">{qty}</span>
                                                <span className="text-xs text-slate-400">{UNIT_LABELS[p.description] || 'دانە'}</span>
                                            </div>
                                            {/* Quick actions */}
                                            <div className="grid grid-cols-2 gap-1.5">
                                                <button
                                                    onClick={() => setAdjustModal({ product: p, mode: 'in' })}
                                                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black transition-colors"
                                                >
                                                    <Plus size={12} weight="bold" /> داخل
                                                </button>
                                                <button
                                                    onClick={() => setAdjustModal({ product: p, mode: 'out' })}
                                                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 text-xs font-black transition-colors"
                                                >
                                                    <Minus size={12} weight="bold" /> دەرچوون
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Modals ── */}
                {adjustModal && (
                    <AdjustModal
                        product={adjustModal.product}
                        mode={adjustModal.mode}
                        onClose={() => setAdjustModal(null)}
                        onSave={handleAdjustSave}
                    />
                )}
                {showHistory && (
                    <MovementHistory
                        movements={movements}
                        onClose={() => setShowHistory(false)}
                    />
                )}
            </div>
        </AdminGuard>
    );
};

export default WarehousePage;
