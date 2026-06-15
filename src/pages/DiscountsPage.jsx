import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    Tag, Plus, Trash, Pencil, X, ToggleLeft, ToggleRight,
    Percent, CurrencyDollar, MagnifyingGlass, CheckCircle, Copy
} from '@phosphor-icons/react';
import AdminGuard from '../components/AdminGuard';

const DISCOUNTS_KEY = 'market_discounts';

const getDiscounts = () => {
    try { return JSON.parse(localStorage.getItem(DISCOUNTS_KEY) || '[]'); } catch { return []; }
};
const saveDiscounts = (list) => localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(list));

const generateCode = (name) => {
    const letters = (name || 'DSC').replace(/\s+/g, '').toUpperCase().slice(0, 4);
    const num = Math.floor(100 + Math.random() * 900);
    return letters + num;
};

const emptyForm = { name: '', code: '', type: 'percent', value: '', minPurchase: '', expiresAt: '', active: true };

const DiscountsPage = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [discounts, setDiscounts] = useState(getDiscounts());
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const filtered = useMemo(() => {
        if (!search.trim()) return discounts;
        const q = search.toLowerCase();
        return discounts.filter(d => d.name?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q));
    }, [discounts, search]);

    const stats = useMemo(() => ({
        total: discounts.length,
        active: discounts.filter(d => d.active).length,
        inactive: discounts.filter(d => !d.active).length,
    }), [discounts]);

    const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowModal(true); };
    const openEdit = (d) => { setForm({ ...d }); setEditingId(d.id); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setForm(emptyForm); setEditingId(null); };

    const handleSave = () => {
        if (!form.name.trim()) { toast.error('ناوی داشکاندن پێویستە'); return; }
        if (!form.value || Number(form.value) <= 0) { toast.error('نرخی داشکاندن پێویستە'); return; }
        if (form.type === 'percent' && Number(form.value) > 100) { toast.error('ڕێژەکە نابێت زیاتر بێت لە ١٠٠'); return; }

        const code = form.code.trim().toUpperCase() || generateCode(form.name);
        const existing = discounts.find(d => d.code === code && d.id !== editingId);
        if (existing) { toast.error('ئەم کۆدە پێشتر بەکار هاتووە'); return; }

        const entry = {
            ...form,
            code,
            value: Number(form.value),
            minPurchase: Number(form.minPurchase) || 0,
            id: editingId || Date.now(),
            createdAt: editingId ? form.createdAt : new Date().toISOString(),
        };

        let updated;
        if (editingId) {
            updated = discounts.map(d => d.id === editingId ? entry : d);
            toast.success('داشکاندن نوێکرایەوە');
        } else {
            updated = [entry, ...discounts];
            toast.success('داشکاندنی نوێ زیادکرا ✅');
        }
        setDiscounts(updated);
        saveDiscounts(updated);
        closeModal();
    };

    const handleToggle = (id) => {
        const updated = discounts.map(d => d.id === id ? { ...d, active: !d.active } : d);
        setDiscounts(updated);
        saveDiscounts(updated);
    };

    const handleDelete = (id) => {
        const updated = discounts.filter(d => d.id !== id);
        setDiscounts(updated);
        saveDiscounts(updated);
        setDeleteId(null);
        toast.success('داشکاندن سڕایەوە');
    };

    const copyCode = (code) => {
        navigator.clipboard?.writeText(code).then(() => toast.success('کۆد کۆپی کرا: ' + code));
    };

    return (
        <AdminGuard>
            <div className="space-y-5 pb-6" dir={isRTL ? 'rtl' : 'ltr'}>

                {/* Header */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <Tag size={22} weight="duotone" className="text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">داشکاندن</h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400">بەڕێوەبردنی هەڵپاردە و داشکاندنەکان</p>
                        </div>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-black text-sm transition-colors shadow-sm"
                    >
                        <Plus size={18} weight="bold" /> داشکاندنی نوێ
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'کۆی داشکاندنەکان', value: stats.total, color: 'slate' },
                        { label: 'چالاک', value: stats.active, color: 'emerald' },
                        { label: 'ناچالاک', value: stats.inactive, color: 'red' },
                    ].map((s, i) => (
                        <div key={i} className="glass-panel rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 text-center">
                            <p className={`text-3xl font-black text-${s.color}-600 dark:text-${s.color}-400`}>{s.value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-bold">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Search */}
                <div className="relative">
                    <MagnifyingGlass size={16} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="گەڕان بە ناو یان کۆد..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full ps-10 pe-4 py-2.5 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-700 dark:text-slate-300 transition-colors"
                    />
                </div>

                {/* Table */}
                <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                            <Tag size={56} weight="duotone" className="text-slate-300 dark:text-slate-700" />
                            <p className="font-black text-lg">هیچ داشکاندنێک نییە</p>
                            <button onClick={openAdd} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors">
                                + زیادکردنی یەکەم داشکاندن
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40">
                                        {['ناو', 'کۆد', 'جۆر', 'نرخ', 'کەمترین کڕین', 'بەسەرچوون', 'ئێستا', 'کردارەکان'].map(h => (
                                            <th key={h} className="px-4 py-3 text-start text-xs font-black text-slate-500 dark:text-slate-400 uppercase whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {filtered.map(d => (
                                        <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">{d.name}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => copyCode(d.code)}
                                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 font-mono text-xs font-black text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                                                >
                                                    {d.code} <Copy size={11} />
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-black ${d.type === 'percent' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                                    {d.type === 'percent' ? 'دەریا %' : 'بڕی دیاری'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-black text-sm text-slate-800 dark:text-slate-100">
                                                {d.type === 'percent' ? `${d.value}%` : `${Number(d.value).toLocaleString()} د.ع`}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {d.minPurchase ? `${Number(d.minPurchase).toLocaleString()} د.ع` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                                                {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('ckb') : '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => handleToggle(d.id)} className="transition-colors">
                                                    {d.active
                                                        ? <ToggleRight size={28} weight="fill" className="text-emerald-500" />
                                                        : <ToggleLeft size={28} className="text-slate-400" />
                                                    }
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                {deleteId === d.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleDelete(d.id)} className="px-2 py-1 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-colors">دڵنیام</button>
                                                        <button onClick={() => setDeleteId(null)} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold transition-colors">نەخێر</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEdit(d)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"><Pencil size={15} /></button>
                                                        <button onClick={() => setDeleteId(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><Trash size={15} /></button>
                                                    </div>
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
                        <div className="relative bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl w-full max-w-md border border-slate-200/60 dark:border-slate-800/60" onClick={e => e.stopPropagation()}>
                            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <h2 className="font-black text-lg text-slate-800 dark:text-slate-100">{editingId ? 'دەستکاری داشکاندن' : 'داشکاندنی نوێ'}</h2>
                                <button onClick={closeModal} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"><X size={18} /></button>
                            </div>
                            <div className="p-5 space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">ناوی داشکاندن *</label>
                                    <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="وەک: داشکاندنی هاوینە" autoFocus
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                {/* Code */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">کۆدی داشکاندن (ئارەزوومەندانە — ئۆتۆماتیک دروستدەبێت)</label>
                                    <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                        placeholder="وەک: SUMMER30"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 transition-colors uppercase" />
                                </div>
                                {/* Type */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">جۆری داشکاندن</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[['percent', 'دەریا %', Percent], ['fixed', 'بڕی دیاری', CurrencyDollar]].map(([val, lbl, Icon]) => (
                                            <button key={val} onClick={() => setForm(p => ({ ...p, type: val }))}
                                                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${form.type === val ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                                <Icon size={16} />{lbl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {/* Value */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{form.type === 'percent' ? 'ڕێژەی داشکاندن (%)' : 'بڕی داشکاندن (د.ع)'} *</label>
                                    <input type="number" value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                                        placeholder={form.type === 'percent' ? '0 - 100' : '0'}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                {/* Min Purchase */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">کەمترین کڕین (د.ع) — ئارەزوومەندانە</label>
                                    <input type="number" value={form.minPurchase} onChange={e => setForm(p => ({ ...p, minPurchase: e.target.value }))}
                                        placeholder="0"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                {/* Expires */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">بەسەرچوون — ئارەزوومەندانە</label>
                                    <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-emerald-500 text-slate-800 dark:text-slate-200 transition-colors" />
                                </div>
                                {/* Active */}
                                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">چالاک بکە ئێستا</span>
                                    <button onClick={() => setForm(p => ({ ...p, active: !p.active }))}>
                                        {form.active ? <ToggleRight size={32} weight="fill" className="text-emerald-500" /> : <ToggleLeft size={32} className="text-slate-400" />}
                                    </button>
                                </div>
                            </div>
                            <div className="px-5 pb-5 flex gap-3">
                                <button onClick={closeModal} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">پاشگەزبوون</button>
                                <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black transition-colors">پشتگیری</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminGuard>
    );
};

export default DiscountsPage;
