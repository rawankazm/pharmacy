import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { getSales, fetchExpenses } from '../api';
import { X, Printer, Lock, WarningCircle, CheckCircle, CurrencyDollar, TrendUp, ClipboardText } from '@phosphor-icons/react';
import toast from 'react-hot-toast';

const EndShiftModal = ({ onClose, onConfirm, currentUser }) => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ckb' || i18n.language === 'ar';

    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [countedCash, setCountedCash] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        const loadShiftData = async () => {
            setLoading(true);
            try {
                const [salesRes, expensesRes] = await Promise.all([getSales(), fetchExpenses()]);
                setSales(salesRes.data || []);
                setExpenses(expensesRes.data || []);
            } catch (error) {
                console.error("Failed to load shift closing data", error);
                toast.error("کێشەیەک لە بارکردنی زانیارییەکانی شیفتدا ڕوویدا");
            } finally {
                setLoading(false);
            }
        };
        loadShiftData();
    }, []);

    // Filter calculations
    const shiftStats = useMemo(() => {
        if (!currentUser) return { startingCash: 0, cashSales: 0, cardSales: 0, debtSales: 0, totalSales: 0, shiftExpenses: 0, expectedCash: 0 };

        const loginDate = new Date(currentUser.loginTime);
        const startingCash = Number(currentUser.startingCash || 0);

        // Filter sales by this cashier and after login time
        const shiftSales = sales.filter(s => {
            const saleDate = new Date(s.paid_at || s.created_at);
            return saleDate >= loginDate && s.cashier_name === currentUser.name;
        });

        // Filter expenses after login time
        const shiftExpenses = expenses.filter(e => {
            const expDate = new Date(e.created_at);
            return expDate >= loginDate;
        }).reduce((sum, e) => sum + Number(e.amount || 0), 0);

        let cashSales = 0;
        let cardSales = 0;
        let debtSales = 0;
        let totalSales = 0;

        shiftSales.forEach(s => {
            const amount = Number(s.total_amount || s.total || 0);
            totalSales += amount;
            if (s.payment_method === 'cash' || !s.payment_method) {
                cashSales += amount;
            } else if (s.payment_method === 'card') {
                cardSales += amount;
            } else if (s.payment_method === 'debt') {
                debtSales += amount;
            }
        });

        const expectedCash = startingCash + cashSales - shiftExpenses;

        return {
            startingCash,
            cashSales,
            cardSales,
            debtSales,
            totalSales,
            shiftExpenses,
            expectedCash,
            salesCount: shiftSales.length
        };
    }, [sales, expenses, currentUser]);

    const difference = useMemo(() => {
        const counted = parseFloat(countedCash) || 0;
        return counted - shiftStats.expectedCash;
    }, [countedCash, shiftStats.expectedCash]);

    const handleConfirmClose = (e) => {
        e.preventDefault();
        const counted = parseFloat(countedCash);
        if (isNaN(counted) || counted < 0) {
            toast.error("تکایە بڕی پارەی ژمێردراو بە دروستی بنووسە");
            return;
        }

        try {
            // Save report
            const newReport = {
                id: Date.now(),
                cashierName: currentUser.name,
                loginTime: currentUser.loginTime,
                endTime: new Date().toISOString(),
                startingCash: shiftStats.startingCash,
                cashSales: shiftStats.cashSales,
                cardSales: shiftStats.cardSales,
                debtSales: shiftStats.debtSales,
                expenses: shiftStats.shiftExpenses,
                expectedCash: shiftStats.expectedCash,
                countedCash: counted,
                difference: difference,
                notes: notes
            };

            const existingReports = JSON.parse(localStorage.getItem('market_shift_reports') || '[]');
            existingReports.unshift(newReport);
            localStorage.setItem('market_shift_reports', JSON.stringify(existingReports));

            // Save last closing cash as seed for next shift
            localStorage.setItem('last_closing_cash', String(counted));

            toast.success("شیفت بە سەرکەوتوویی داخرا و ڕاپۆرتی زێد ئامادەیە");
            
            // Print report
            setTimeout(() => {
                window.print();
                onConfirm(); // Logout & reload
            }, 300);

        } catch (error) {
            console.error(error);
            toast.error("خەزنکردنی ڕاپۆرتەکە سەرکەوتوو نەبوو");
        }
    };

    const formatCurrency = (n) => Number(n || 0).toLocaleString() + ' د.ع';

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl flex items-center gap-3 text-slate-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                    <span className="font-bold">بارکردنی زانیارییەکانی کۆتایی ڕۆژ...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in print:absolute print:inset-0 print:bg-white print:animate-none print:z-[9999] print:block print:h-auto print:overflow-visible print:p-0">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col overflow-hidden print:shadow-none print:border-none print:w-full print:max-w-none print:h-auto print:overflow-visible print:rounded-none" dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-150 dark:border-gray-700/60 flex justify-between items-center bg-gray-50 dark:bg-gray-900/40 print:hidden">
                    <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <Lock size={20} className="text-rose-500" />
                        ڕاپۆرتی کۆتایی ڕۆژ و داخستنی شیفت
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleConfirmClose} className="p-6 overflow-y-auto flex-1 space-y-4 print:hidden">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">کاشێری شیفت</p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">{currentUser.name}</p>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">کاتی دەستپێکردن</p>
                            <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">{new Date(currentUser.loginTime).toLocaleTimeString('ckb')}</p>
                        </div>
                    </div>

                    {/* Stats List */}
                    <div className="space-y-2.5">
                        <h3 className="text-xs font-black text-slate-450 dark:text-slate-500 uppercase tracking-wider">ئامارەکانی شیفتی ئێستا</h3>
                        <div className="glass-panel p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 space-y-3">
                            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                <span>پارەی دەستپێکی سندوق (Starting Cash):</span>
                                <span className="font-mono">{formatCurrency(shiftStats.startingCash)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                <span>کۆى فرۆشتنی نەختینە (Cash Sales):</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">+{formatCurrency(shiftStats.cashSales)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                <span>کۆی فرۆشتنی کارت (Card Sales):</span>
                                <span className="font-mono text-blue-600 dark:text-blue-400">+{formatCurrency(shiftStats.cardSales)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                                <span>فرۆشتنی دەفتەری قەرز (Debt):</span>
                                <span className="font-mono text-slate-500">+{formatCurrency(shiftStats.debtSales)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/40 pt-2.5">
                                <span>خەرجییەکانی ئەم شیفتە (Expenses):</span>
                                <span className="font-mono text-rose-500">-{formatCurrency(shiftStats.shiftExpenses)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-slate-800 dark:text-white border-t border-slate-150 dark:border-slate-800 pt-2.5">
                                <span>پارەی چاوەڕوانکراوی سندوق (Expected Cash):</span>
                                <span className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(shiftStats.expectedCash)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Closing Verification Form */}
                    <div className="space-y-3 pt-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-455">پارەی ژمێردراوی سندوق (Physical Cash counted)</label>
                            <input
                                type="number"
                                value={countedCash}
                                onChange={e => setCountedCash(e.target.value)}
                                placeholder="بڕی پارەی ناو سندوقەکە بنووسە..."
                                className="w-full p-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 rounded-2xl text-lg font-black outline-none focus:border-rose-500 dark:text-white text-center"
                                required
                            />
                        </div>

                        {/* Real-time discrepancy alert */}
                        {countedCash !== '' && (
                            <div className={`p-3.5 rounded-2xl text-xs font-bold text-center border ${
                                difference === 0 
                                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 text-emerald-600 dark:text-emerald-400' 
                                    : difference > 0 
                                        ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 text-blue-600 dark:text-blue-400' 
                                        : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 text-rose-600 dark:text-rose-400'
                            }`}>
                                <p className="font-black text-sm">
                                    {difference === 0 
                                        ? 'سندوقەکە تەواو و هاوسەنگە' 
                                        : difference > 0 
                                            ? `پارەی زیادە لە سندوقدا هەیە: ${formatCurrency(difference)}`
                                            : `کورتهێنان لە سندوقدا هەیە: ${formatCurrency(Math.abs(difference))}`
                                    }
                                </p>
                            </div>
                        )}

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-black text-slate-500 dark:text-slate-455">تێبینییەکان (تایبەت بە کورتهێنان یان زیادە)</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="تێبینی بنووسە..."
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-850 rounded-2xl text-xs outline-none focus:border-rose-500 dark:text-white resize-none h-16"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2.5 pt-3">
                        <button
                            type="submit"
                            className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-750 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-600/15 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                        >
                            <Printer size={16} weight="bold" />
                            چاپکردن و داخستنی شیفت
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black transition-all"
                        >
                            پاشگەزبوونەوە
                        </button>
                    </div>
                </form>

                {/* Z-Report Printable Sheet */}
                <div id="shift-report-print" className="hidden print:block bg-white p-8 text-black w-full h-auto overflow-visible text-right" dir="rtl">
                    <div className="text-center mb-6 border-b-2 border-dashed border-gray-400 pb-4">
                        <h1 className="text-2xl font-black">ڕاپۆرتی کۆتایی شیفت (Z-Report)</h1>
                        <p className="text-xs text-gray-500 mt-1">{new Date().toLocaleString('ckb')}</p>
                    </div>

                    <div className="space-y-3 mb-6 text-sm">
                        <div className="flex justify-between">
                            <strong>کاشێری بەرپرسیار:</strong>
                            <span>{currentUser?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <strong>کاتی دەستپێکردنی شیفت:</strong>
                            <span>{currentUser?.loginTime ? new Date(currentUser.loginTime).toLocaleString('ckb') : '—'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 pb-2">
                            <strong>کاتی داخستنی شیفت:</strong>
                            <span>{new Date().toLocaleString('ckb')}</span>
                        </div>

                        <div className="flex justify-between font-bold pt-2">
                            <span>پارەی دەستپێک (Starting Cash):</span>
                            <span>{formatCurrency(shiftStats.startingCash)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>فرۆشتنی نەختینە (Cash Sales):</span>
                            <span>+{formatCurrency(shiftStats.cashSales)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>فرۆشتنی کارت (Card Sales):</span>
                            <span>+{formatCurrency(shiftStats.cardSales)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>قەرزی نوێ (Debt Sales):</span>
                            <span>+{formatCurrency(shiftStats.debtSales)}</span>
                        </div>
                        <div className="flex justify-between text-red-600 border-b border-gray-200 pb-2">
                            <span>کۆی خەرجی شیفت (Expenses):</span>
                            <span>-{formatCurrency(shiftStats.shiftExpenses)}</span>
                        </div>

                        <div className="flex justify-between font-black text-base pt-2">
                            <span>پارەی چاوەڕوانکراو (Expected Cash):</span>
                            <span>{formatCurrency(shiftStats.expectedCash)}</span>
                        </div>
                        <div className="flex justify-between font-black text-base border-b border-gray-300 pb-2">
                            <span>پارەی ژمێردراو (Counted Cash):</span>
                            <span>{formatCurrency(parseFloat(countedCash) || 0)}</span>
                        </div>

                        <div className="flex justify-between font-black text-base pt-2">
                            <span>جیاوازی سندوق (Discrepancy):</span>
                            <span className={difference === 0 ? 'text-green-600' : difference > 0 ? 'text-blue-600' : 'text-red-600'}>
                                {difference === 0 
                                    ? 'هاوسەنگە' 
                                    : difference > 0 
                                        ? `زیادە: ${formatCurrency(difference)}`
                                        : `کورتهێنان: ${formatCurrency(difference)}`
                                }
                            </span>
                        </div>
                        
                        {notes && (
                            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <strong>تێبینییەکان:</strong>
                                <p className="mt-1 text-xs text-gray-600">{notes}</p>
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
                        سیستمی دەرمانخانە پۆس (Simply Meds)
                    </div>
                </div>

            </div>
        </div>
    );
};

export default EndShiftModal;
