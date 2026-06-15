import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    ArrowUUpLeft, Plus, Trash, X, MagnifyingGlass, Package,
    CalendarBlank, WarningCircle, Funnel, CurrencyDollar, Receipt
} from '@phosphor-icons/react';
import AdminGuard from '../components/AdminGuard';
import { fetchProducts } from '../api';

const RETURNS_KEY = 'market_returns';

const getReturns = () => { try { return JSON.parse(localStorage.getItem(RETURNS_KEY) || '[]'); } catch { return []; } };
const saveReturns = (list) => localStorage.setItem(RETURNS_KEY, JSON.stringify(list));

const REASONS = ['کاڵای خراپ', 'شاشەی بەها', 'گواستنەوەی داهاتوو', 'دواگەڕانەوەی کڕیار', 'تر'];
const UNIT_LABELS = { piece: 'دانە', carton: 'کارتۆن', kilo: 'کیلۆ', pack: 'پاکێت' };

const emptyForm = { productId: '', productName: '', quantity: '1', unit: 'piece', reason: REASONS[0], refundAmount: '', cashierName: '', notes: '' };

const ReturnsPage = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [returns, setReturns] = useState(getReturns());
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        fetchProducts().then(r => setProducts(r.data || []));
    }, []);

    const filtered = useMemo(() => {
        let list = [...returns].sort((a, b) => new Date(b.date) - new Date(a.date));
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(r => r.productName?.toLowerCase().includes(q));
        }
        if (dateFrom) list = list.filter(r => new Date(r.date) >= new Date(dateFrom));
        if (dateTo) list = list.filter(r => new Date(r.date) <= new Date(dateTo + 'T23:59:59'));
        return list;
    }, [returns, search, dateFrom, dateTo]);

    const stats = useMemo(() => ({
        total: returns.length,
        totalRefund: returns.reduce((sum, r) => sum + (Number(r.refundAmount) || 0), 0),
        todayCount: returns.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).length,
    }), [returns]);

    const openModal = () => { setForm(emptyForm); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setForm(emptyForm); };

    const handleProductSelect = (e) => {
        const pid = e.target.value;
        const prod = products.find(p => String(p.id) === pid);
        if (prod) {
            setForm(prev => ({
                ...prev,
                productId: pid,
                productName: prod.name_ckb || prod.name,
                unit: prod.description || 'piece',
                refundAmount: String(Number(prod.price) * (parseInt(prev.quantity) || 1)),
            }));
        } else {
            setForm(prev => ({ ...prev, productId: '', productName: '', refundAmount: '' }));
        }
    };

    const handleQtyChange = (e) => {
        const qty = e.target.value;
        setForm(prev => {
            const prod = products.find(p => String(p.id) === prev.productId);
            const refund = prod ? String(Number(prod.price) * (parseInt(qty) || 1)) : prev.refundAmount;
            return { ...prev, quantity: qty, refundAmount: refund };
        });
    };

    const handleSave = () => {
        if (!form.productName.trim()) { toast.error('تکایە بەرهەمێک هەڵبژێرە'); return; }
        if (!form.quantity || Number(form.quantity) <= 0) { toast.error('بڕی دروست بنووسە'); return; }
        const entry = {
            ...form,
            id: Date.now(),
            quantity: Number(form.quantity),
            refundAmount: Number(form.refundAmount) || 0,
            date: new Date().toISOString(),
        };
        const updated = [entry, ...returns];
        setReturns(updated);
        saveReturns(updated);
        toast.success('گەڕانەوەکە تۆمارکرا ✅');
        closeModal();
    };

    const handleDelete = (id) => {
        const updated = returns.filter(r => r.id !== id);
        setReturns(updated);
        saveReturns(updated);
        setDeleteId(null);
        toast.success('تۆمار سڕایەوە');
    };

    return (
        <AdminGuard>
            <div className="space-y-5 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <ArrowUUpLeft size={22} weight="duotone" className="text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">گەڕانەوەی کاڵا</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">تۆماری گەڕانەوەکان و کاڵای گەڕاوە</p>
                        </div>
                    </div>
                    <button onClick={openModal} className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm transition-colors shadow-sm">
                        <Plus size={18} weight="bold" /> گەڕانەوەی نوێ
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'کۆی گەڕانەوەکان', value: stats.total, icon: ArrowUUpLeft, color: 'amber' },
                        { label: 'کۆی پارەی گەڕاوە', value: stats.totalRefund.toLocaleString() + ' د.ع', icon: CurrencyDollar, color: 'red' },
                        { label: 'گەڕانەوەی ئەمڕۆ', value: stats.todayCount, icon: CalendarBlank, color: 'blue' },
                    ].map((s, i) => (
                        <div key={i} className="glass-panel rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 flex items-center gap-3 hover-lift">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-100 dark:bg-${s.color}-900/30 flex-shrink-0`}>
                                <s.icon size={20} weight="duotone" className={`text-${s.color}-500`} />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-800 dark:text-slate-100">{s.value}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="glass-panel p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex flex-wrap gap-3 items-center">
                    <div className="relative flex-1 min-w-[180px]">
                        <MagnifyingGlass size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" placeholder="گەڕان بە ناوی بەرهەم..." value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full ps-9 pe-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300 transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarBlank size={15} className="text-slate-400" />
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300" />
                        <span className="text-slate-400 text-sm">—</span>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-700 dark:text-slate-300" />
                    </div>
                    <span className="text-xs text-slate-400 font-bold">{filtered.length} تۆمار</span>
                </div>

                {/* Table */}
                <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                            <ArrowUUpLeft size={56} weight="duotone" className="text-slate-300 dark:text-slate-700" />
                            <p className="font-black text-lg">هیچ گەڕانەوەیەک نییە</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                                        {['کات', 'بەرهەم', 'بڕ', 'مەبەست', 'پارەی گەڕاوە', 'کاشێر', 'تێبینی', ''].map(h => (
                                            <th key={h} className="px-4 py-3 text-start text-xs font-black text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {filtered.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                                                {new Date(r.date).toLocaleDateString('ckb')}<br />
                                                <span className="text-[10px]">{new Date(r.date).toLocaleTimeString('ckb', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Package size={16} className="text-amber-500 flex-shrink-0" />
                                                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{r.productName}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-black text-sm text-slate-800 dark:text-slate-100">
                                                {r.quantity} <span className="text-xs font-normal text-slate-400">{UNIT_LABELS[r.unit] || 'دانە'}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-xs font-bold">{r.reason}</span>
                                            </td>
                                            <td className="px-4 py-3 font-black text-sm text-red-600 dark:text-red-400">
                                                {Number(r.refundAmount).toLocaleString()} د.ع
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{r.cashierName || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-slate-400 max-w-[120px] truncate">{r.notes || '—'}</td>
                                            <td className="px-4 py-3">
                                                {deleteId === r.id ? (
                                                    <div className="flex gap-1">
                                                        <button onClick={() => handleDelete(r.id)} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold">دڵنیام</button>
                                                        <button onClick={() => setDeleteId(null)} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold">نەخێر</button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Trash size={15} />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeModal}>
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
                        <div className="relative bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-slate-800/60 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                            <div className="sticky top-0 bg-white dark:bg-[#0f172a] p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="font-black text-lg text-slate-800 dark:text-slate-100">گەڕانەوەی نوێ</h2>
                                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Product */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">بەرهەم *</label>
                                    <select value={form.productId} onChange={handleProductSelect}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 transition-colors">
                                        <option value="">— بەرهەمێک هەڵبژێرە —</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name_ckb || p.name}</option>)}
                                    </select>
                                </div>
                                {/* Qty */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">بڕ *</label>
                                    <input type="number" min="1" value={form.quantity} onChange={handleQtyChange}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                {/* Reason */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">مەبەستی گەڕانەوە *</label>
                                    <select value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 transition-colors">
                                        {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                {/* Refund */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">پارەی گەڕاوە (د.ع)</label>
                                    <input type="number" value={form.refundAmount} onChange={e => setForm(p => ({ ...p, refundAmount: e.target.value }))}
                                        placeholder="ئۆتۆماتیک حساب دەکرێت"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                {/* Cashier */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">ناوی کاشێر</label>
                                    <input type="text" value={form.cashierName} onChange={e => setForm(p => ({ ...p, cashierName: e.target.value }))}
                                        placeholder="ناوی کاشێر..."
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">تێبینی</label>
                                    <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                        rows={2} placeholder="تێبینی زیاتر..."
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-amber-500 text-slate-800 dark:text-slate-200 transition-colors resize-none" />
                                </div>
                            </div>
                            <div className="px-5 pb-5 flex gap-3">
                                <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">پاشگەزبوون</button>
                                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black transition-colors">تۆمارکردن</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminGuard>
    );
};

export default ReturnsPage;
