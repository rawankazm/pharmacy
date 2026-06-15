import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
    ClipboardText, Trash, Printer, CalendarBlank, Funnel, User, X,
    MagnifyingGlass, WarningCircle, CheckCircle, CurrencyDollar, Eye, Clock, Coins
} from '@phosphor-icons/react';
import AdminGuard from '../components/AdminGuard';

const SHIFT_REPORTS_KEY = 'market_shift_reports';

const getShiftReports = () => {
    try {
        return JSON.parse(localStorage.getItem(SHIFT_REPORTS_KEY) || '[]');
    } catch {
        return [];
    }
};

const saveShiftReports = (list) => {
    localStorage.setItem(SHIFT_REPORTS_KEY, JSON.stringify(list));
};

const ShiftReportsPage = () => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [reports, setReports] = useState(getShiftReports());
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'balanced' | 'shortage' | 'overage'
    
    // View Modal & Delete confirmation states
    const [selectedReport, setSelectedReport] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Filter reports based on search query, date range, and status
    const filteredReports = useMemo(() => {
        let list = [...reports].sort((a, b) => new Date(b.endTime || b.id) - new Date(a.endTime || a.id));

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(r => r.cashierName?.toLowerCase().includes(q));
        }

        if (dateFrom) {
            list = list.filter(r => {
                const date = new Date(r.endTime || r.id);
                return date >= new Date(dateFrom);
            });
        }

        if (dateTo) {
            list = list.filter(r => {
                const date = new Date(r.endTime || r.id);
                return date <= new Date(dateTo + 'T23:59:59');
            });
        }

        if (statusFilter !== 'all') {
            list = list.filter(r => {
                const diff = Number(r.difference || 0);
                if (statusFilter === 'balanced') return diff === 0;
                if (statusFilter === 'shortage') return diff < 0;
                if (statusFilter === 'overage') return diff > 0;
                return true;
            });
        }

        return list;
    }, [reports, searchQuery, dateFrom, dateTo, statusFilter]);

    // Calculate overall stats for the current filtered list
    const stats = useMemo(() => {
        let totalShifts = filteredReports.length;
        let totalStartingCash = 0;
        let totalCashSales = 0;
        let totalCardSales = 0;
        let totalDebtSales = 0;
        let totalExpenses = 0;
        let totalExpectedCash = 0;
        let totalCountedCash = 0;
        let totalDifference = 0;

        filteredReports.forEach(r => {
            totalStartingCash += Number(r.startingCash || 0);
            totalCashSales += Number(r.cashSales || 0);
            totalCardSales += Number(r.cardSales || 0);
            totalDebtSales += Number(r.debtSales || 0);
            totalExpenses += Number(r.expenses || 0);
            totalExpectedCash += Number(r.expectedCash || 0);
            totalCountedCash += Number(r.countedCash || 0);
            totalDifference += Number(r.difference || 0);
        });

        return {
            totalShifts,
            totalStartingCash,
            totalCashSales,
            totalCardSales,
            totalDebtSales,
            totalExpenses,
            totalExpectedCash,
            totalCountedCash,
            totalDifference
        };
    }, [filteredReports]);

    const formatCurrency = (n) => Number(n || 0).toLocaleString() + ' د.ع';

    const handleDeleteReport = (id) => {
        const updated = reports.filter(r => r.id !== id);
        setReports(updated);
        saveShiftReports(updated);
        toast.success('ڕاپۆرتی شیفتەکە بە سەرکەوتوویی سڕایەوە');
        setDeleteId(null);
    };

    const handlePrintReport = (report) => {
        setSelectedReport(report);
        setTimeout(() => {
            window.print();
        }, 150);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('ckb-IQ', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }) + ' ' + d.toLocaleTimeString('ckb-IQ', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AdminGuard>
            <div className="space-y-6 pb-10 print:p-0" dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* Header Section */}
                <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center border border-emerald-500/20">
                            <ClipboardText size={26} weight="duotone" className="text-emerald-600 dark:text-emerald-450" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-slate-100">ڕاپۆرتەکانی کۆتایی ڕۆژ (شیفتەکان)</h1>
                            <p className="text-xs text-slate-550 dark:text-slate-400 font-bold mt-0.5">بەدواداچوون بۆ کڕین و فرۆشتنی سەر سندوق، جیاوازی پارە و خەرجی شیفتەکان</p>
                        </div>
                    </div>
                </div>

                {/* Stats Cards Section */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover-lift">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">کۆی شیفتە داخراوەکان</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <Clock size={18} weight="bold" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{stats.totalShifts} شیفت</h2>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover-lift">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">کۆی فرۆشتنی نەختینە</span>
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                <Coins size={18} weight="bold" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalCashSales)}</h2>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover-lift">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">کۆی خەرجی شیفتەکان</span>
                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
                                <CurrencyDollar size={18} weight="bold" />
                            </div>
                        </div>
                        <h2 className="text-xl font-black text-rose-600 dark:text-rose-450">-{formatCurrency(stats.totalExpenses)}</h2>
                    </div>

                    <div className={`glass-panel p-5 rounded-2xl border hover-lift ${
                        stats.totalDifference === 0 
                            ? 'border-emerald-200 dark:border-emerald-900/30 bg-emerald-500/5' 
                            : stats.totalDifference > 0 
                                ? 'border-blue-200 dark:border-blue-900/30 bg-blue-500/5' 
                                : 'border-rose-200 dark:border-rose-900/30 bg-rose-500/5'
                    }`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">کۆی جیاوازی سندوق</span>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                stats.totalDifference === 0 ? 'bg-emerald-500/10 text-emerald-600' : stats.totalDifference > 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                                <WarningCircle size={18} weight="bold" />
                            </div>
                        </div>
                        <h2 className={`text-xl font-black ${
                            stats.totalDifference === 0 ? 'text-emerald-600 dark:text-emerald-400' : stats.totalDifference > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-455'
                        }`}>
                            {stats.totalDifference > 0 ? '+' : ''}{formatCurrency(stats.totalDifference)}
                        </h2>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-3.5 print:hidden">
                    {/* Search Field */}
                    <div className="relative flex-1 min-w-[240px]">
                        <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                            <MagnifyingGlass size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="گەڕان بەپێی ناوی کاشێر..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 dark:text-white"
                        />
                    </div>

                    {/* Date Filters */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                            <CalendarBlank size={16} className="text-slate-400" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold outline-none text-slate-700 dark:text-slate-200 p-0.5"
                            />
                        </div>
                        <span className="text-slate-400 text-xs font-bold">تاکو</span>
                        <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1">
                            <CalendarBlank size={16} className="text-slate-400" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold outline-none text-slate-700 dark:text-slate-200 p-0.5"
                            />
                        </div>
                        {(dateFrom || dateTo) && (
                            <button
                                onClick={() => { setDateFrom(''); setDateTo(''); }}
                                className="text-xs text-rose-500 hover:underline font-bold"
                            >
                                سڕینەوەی بەروار
                            </button>
                        )}
                    </div>

                    {/* Discrepancy Status Filters */}
                    <div className="flex bg-slate-100 dark:bg-slate-900/60 border border-slate-200/20 dark:border-slate-800 rounded-xl p-1 gap-1">
                        {[
                            { val: 'all', label: 'هەموو جۆرەکان' },
                            { val: 'balanced', label: 'هاوسەنگ' },
                            { val: 'shortage', label: 'کورتهێنان' },
                            { val: 'overage', label: 'پارەی زیادە' }
                        ].map((btn) => (
                            <button
                                key={btn.val}
                                onClick={() => setStatusFilter(btn.val)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    statusFilter === btn.val
                                        ? 'bg-white dark:bg-slate-850 shadow text-emerald-600 dark:text-emerald-400'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Reports Table Section */}
                <div className="glass-panel rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden print:hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400">ڕێکەوت و کات</th>
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400">کاشێر</th>
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 text-center">سەرەتای سندوق</th>
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 text-center">فرۆشتنی نەختینە</th>
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 text-center">خەرجی شیفت</th>
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 text-center">پارەی چاوەڕوانکراو</th>
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 text-center">ژمێردراوی سندوق</th>
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 text-center">جیاوازی</th>
                                    <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 text-center">کردارەکان</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="p-10 text-center text-slate-400 dark:text-slate-600 font-bold">
                                            <div className="flex flex-col items-center gap-2">
                                                <ClipboardText size={48} className="opacity-40" />
                                                <span>هیچ ڕاپۆرتێکی شیفت لەم فلتەرەدا نەدۆزرایەوە</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredReports.map((report) => {
                                    const diff = Number(report.difference || 0);
                                    return (
                                        <tr key={report.id} className="border-b border-slate-100 dark:border-slate-855/60 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all">
                                            <td className="p-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {formatDate(report.endTime || report.id)}
                                            </td>
                                            <td className="p-4 text-xs font-black text-slate-850 dark:text-white">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-450 flex items-center justify-center font-black text-[10px]">
                                                        {report.cashierName?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span>{report.cashierName}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-mono font-bold text-center text-slate-600 dark:text-slate-400">
                                                {formatCurrency(report.startingCash)}
                                            </td>
                                            <td className="p-4 text-xs font-mono font-black text-center text-emerald-600 dark:text-emerald-450">
                                                {formatCurrency(report.cashSales)}
                                            </td>
                                            <td className="p-4 text-xs font-mono font-bold text-center text-rose-500">
                                                {report.expenses > 0 ? `-${formatCurrency(report.expenses)}` : '0 د.ع'}
                                            </td>
                                            <td className="p-4 text-xs font-mono font-bold text-center text-slate-700 dark:text-slate-300">
                                                {formatCurrency(report.expectedCash)}
                                            </td>
                                            <td className="p-4 text-xs font-mono font-black text-center text-slate-800 dark:text-white">
                                                {formatCurrency(report.countedCash)}
                                            </td>
                                            <td className="p-4 text-xs text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-block ${
                                                    diff === 0 
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' 
                                                        : diff > 0 
                                                            ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' 
                                                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                                                }`}>
                                                    {diff === 0 ? 'هاوسەنگ' : diff > 0 ? `+${formatCurrency(diff)}` : formatCurrency(diff)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    {/* Details Button */}
                                                    <button
                                                        onClick={() => setSelectedReport(report)}
                                                        title="بینینی زانیاری"
                                                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all active:scale-95"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    {/* Reprint Z-Report */}
                                                    <button
                                                        onClick={() => handlePrintReport(report)}
                                                        title="چاپکردنەوەی ڕاپۆرتی زێد"
                                                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-lg transition-all active:scale-95"
                                                    >
                                                        <Printer size={15} />
                                                    </button>
                                                    {/* Delete Button with confirmation */}
                                                    {deleteId === report.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => handleDeleteReport(report.id)}
                                                                className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-black hover:bg-rose-700 transition-all active:scale-95"
                                                            >
                                                                دڵنیام
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteId(null)}
                                                                className="px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all"
                                                            >
                                                                نەخێر
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteId(report.id)}
                                                            title="سڕینەوە"
                                                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/10 dark:hover:bg-rose-950/20 text-rose-600 rounded-lg transition-all active:scale-95"
                                                        >
                                                            <Trash size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Details View Modal */}
                {selectedReport && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden" onClick={() => setSelectedReport(null)}>
                        <div 
                            className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative" 
                            dir={isRTL ? 'rtl' : 'ltr'}
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button onClick={() => setSelectedReport(null)} className="absolute top-4 left-4 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                                <X size={20} />
                            </button>

                            <h3 className="text-base font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-2">
                                <ClipboardText size={20} className="text-emerald-500" />
                                وردەکارییەکانی داخستنی شیفت
                            </h3>

                            <div className="space-y-3.5">
                                <div className="grid grid-cols-2 gap-3.5">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-850/50 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">ناوی کاشێر</p>
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">{selectedReport.cashierName}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-855/50 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">کاتی کۆتایی شیفت</p>
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">{formatDate(selectedReport.endTime || selectedReport.id)}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3.5">
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-855/50 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">کاتی دەستپێکردن</p>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5">{formatDate(selectedReport.loginTime)}</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-855/50 rounded-2xl">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-mono">ID شیفت</p>
                                        <p className="text-[10px] font-mono font-black text-slate-700 dark:text-slate-300 mt-0.5">#{selectedReport.id}</p>
                                    </div>
                                </div>

                                <div className="glass-panel p-4 rounded-2xl border border-slate-105 dark:border-slate-850 space-y-2.5">
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                        <span>پارەی دەستپێکی سندوق (Starting Cash):</span>
                                        <span className="font-mono text-slate-800 dark:text-slate-200">{formatCurrency(selectedReport.startingCash)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                        <span>فرۆشتنی نەختینە (Cash Sales):</span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-450">+{formatCurrency(selectedReport.cashSales)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                        <span>فرۆشتنی کارت (Card Sales):</span>
                                        <span className="font-mono text-blue-600 dark:text-blue-450">+{formatCurrency(selectedReport.cardSales || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                        <span>قەرزی تۆمارکراو (Debt Sales):</span>
                                        <span className="font-mono text-slate-500">+{formatCurrency(selectedReport.debtSales || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-850 pt-2">
                                        <span>خەرجییەکانی ئەم شیفتە (Expenses):</span>
                                        <span className="font-mono text-rose-500">-{formatCurrency(selectedReport.expenses || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-slate-800 dark:text-white border-t border-slate-200 dark:border-slate-800 pt-2">
                                        <span>پارەی چاوەڕوانکراوی سندوق (Expected):</span>
                                        <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(selectedReport.expectedCash)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                                        <span>پارەی ژمێردراوی سندوق (Counted):</span>
                                        <span className="font-mono text-slate-800 dark:text-white">{formatCurrency(selectedReport.countedCash)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-slate-800 dark:text-white pt-1">
                                        <span>جیاوازی سندوق (Discrepancy):</span>
                                        <span className={`font-mono font-black ${
                                            Number(selectedReport.difference || 0) === 0 
                                                ? 'text-emerald-600 dark:text-emerald-450' 
                                                : Number(selectedReport.difference || 0) > 0 
                                                    ? 'text-blue-600 dark:text-blue-400' 
                                                    : 'text-rose-600 dark:text-rose-455'
                                        }`}>
                                            {Number(selectedReport.difference || 0) > 0 ? '+' : ''}
                                            {formatCurrency(selectedReport.difference)}
                                        </span>
                                    </div>
                                </div>

                                {selectedReport.notes && (
                                    <div className="p-3 bg-rose-50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                                        <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold">تێبینییەکان</p>
                                        <p className="text-xs text-slate-700 dark:text-slate-350 mt-1 font-bold">{selectedReport.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2.5 mt-5">
                                <button
                                    onClick={() => handlePrintReport(selectedReport)}
                                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                >
                                    <Printer size={16} weight="bold" />
                                    چاپکردنەوەی ڕاپۆرتی زێد (Z-Report)
                                </button>
                                <button
                                    onClick={() => setSelectedReport(null)}
                                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all"
                                >
                                    داخستن
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Z-Report Printable Sheet (Populated dynamically during print) */}
                {selectedReport && (
                    <div id="shift-report-print" className="hidden print:block bg-white p-8 text-black w-full h-auto overflow-visible text-right" dir="rtl">
                        <div className="text-center mb-6 border-b-2 border-dashed border-gray-400 pb-4">
                            <h1 className="text-2xl font-black">ڕاپۆرتی کۆتایی شیفت (Z-Report)</h1>
                            <p className="text-xs text-gray-500 mt-1">لە چاپ دراوەتەوە لە: {new Date().toLocaleString('ckb')}</p>
                        </div>

                        <div className="space-y-3 mb-6 text-sm">
                            <div className="flex justify-between">
                                <strong>کاشێری بەرپرسیار:</strong>
                                <span>{selectedReport.cashierName}</span>
                            </div>
                            <div className="flex justify-between">
                                <strong>کاتی دەستپێکردنی شیفت:</strong>
                                <span>{selectedReport.loginTime ? new Date(selectedReport.loginTime).toLocaleString('ckb') : '—'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-200 pb-2">
                                <strong>کاتی داخستنی شیفت:</strong>
                                <span>{selectedReport.endTime ? new Date(selectedReport.endTime).toLocaleString('ckb') : formatDate(selectedReport.id)}</span>
                            </div>

                            <div className="flex justify-between font-bold pt-2">
                                <span>پارەی دەستپێک (Starting Cash):</span>
                                <span>{formatCurrency(selectedReport.startingCash)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>فرۆشتنی نەختینە (Cash Sales):</span>
                                <span>+{formatCurrency(selectedReport.cashSales)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>فرۆشتنی کارت (Card Sales):</span>
                                <span>+{formatCurrency(selectedReport.cardSales || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>قەرزی نوێ (Debt Sales):</span>
                                <span>+{formatCurrency(selectedReport.debtSales || 0)}</span>
                            </div>
                            <div className="flex justify-between text-red-600 border-b border-gray-200 pb-2">
                                <span>کۆی خەرجی شیفت (Expenses):</span>
                                <span>-{formatCurrency(selectedReport.expenses || 0)}</span>
                            </div>

                            <div className="flex justify-between font-black text-base pt-2">
                                <span>پارەی چاوەڕوانکراو (Expected Cash):</span>
                                <span>{formatCurrency(selectedReport.expectedCash)}</span>
                            </div>
                            <div className="flex justify-between font-black text-base border-b border-gray-300 pb-2">
                                <span>پارەی ژمێردراو (Counted Cash):</span>
                                <span>{formatCurrency(selectedReport.countedCash)}</span>
                            </div>

                            <div className="flex justify-between font-black text-base pt-2">
                                <span>جیاوازی سندوق (Discrepancy):</span>
                                <span className={Number(selectedReport.difference || 0) === 0 ? 'text-green-600' : Number(selectedReport.difference || 0) > 0 ? 'text-blue-600' : 'text-red-600'}>
                                    {Number(selectedReport.difference || 0) === 0 
                                        ? 'هاوسەنگە' 
                                        : Number(selectedReport.difference || 0) > 0 
                                            ? `زیادە: ${formatCurrency(selectedReport.difference)}`
                                            : `کورتهێنان: ${formatCurrency(selectedReport.difference)}`
                                    }
                                </span>
                            </div>
                            
                            {selectedReport.notes && (
                                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <strong>تێبینییەکان:</strong>
                                    <p className="mt-1 text-xs text-gray-600">{selectedReport.notes}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-12 grid grid-cols-2 gap-8 text-center text-xs">
                            <div className="border-t border-black pt-2">
                                واژۆی کاشێر
                            </div>
                            <div className="border-t border-black pt-2">
                                واژۆی بەرێوەبەر / سەرپەرشتیار
                            </div>
                        </div>

                        <div className="border-t border-dashed border-gray-300 pt-4 mt-12 text-center text-xs text-gray-400">
                            سیستمی مارکێت پۆس (MarketPOS)
                        </div>
                    </div>
                )}

            </div>
        </AdminGuard>
    );
};

export default ShiftReportsPage;
