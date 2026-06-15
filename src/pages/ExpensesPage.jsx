import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { api } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import AdminGuard from '../components/AdminGuard';
import { ClipboardText, Plus, Trash, Funnel, CalendarBlank, ArrowCounterClockwise, CurrencyDollar } from '@phosphor-icons/react';
import { formatDate } from '../utils/dateFormatter';

const ExpensesPage = () => {
    const { t, i18n } = useTranslation();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // Form State
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Ingredients');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadExpenses();
    }, []);

    const loadExpenses = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/expenses');
            if (data) {
                setExpenses(data);
            }
        } catch (error) {
            console.error("Failed to load expenses:", error);
            // Fallback from localStorage
            const mockExpenses = JSON.parse(localStorage.getItem('mockExpenses') || '[]');
            setExpenses(mockExpenses);
        } finally {
            setLoading(false);
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        const cleanAmount = parseFloat(amount);
        if (isNaN(cleanAmount) || cleanAmount <= 0) {
            toast.error("Please enter a valid amount.");
            return;
        }

        if (!description.trim()) {
            toast.error("Please enter a description.");
            return;
        }

        const expenseData = {
            description: description.trim(),
            category,
            amount: cleanAmount,
            created_at: new Date(date).toISOString()
        };

        const toastId = toast.loading("Adding expense...");
        try {
            const { data, error } = await api.post('/expenses', expenseData);
            if (error || !data) throw new Error(error || "No data returned");
 
            toast.success(t('common.save') || "Expense saved!", { id: toastId });
            setDescription('');
            setAmount('');
            setDate(new Date().toISOString().split('T')[0]);
            loadExpenses();
        } catch (error) {
            console.error("Failed to add expense:", error);
            toast.error(t('common.error') || "Failed to save expense.", { id: toastId });
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm(t('expenses.delete_confirm') || "Are you sure you want to delete this expense?")) {
            return;
        }

        const toastId = toast.loading("Deleting expense...");
        try {
            const { error } = await api.delete(`/expenses/${id}`);
            if (error) throw error;

            toast.success("Expense deleted", { id: toastId });
            loadExpenses();
        } catch (error) {
            console.error("Failed to delete expense:", error);
            toast.error("Failed to delete expense.", { id: toastId });
        }
    };

    // Filters
    const filteredExpenses = expenses.filter(e => {
        const matchesSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             t(`expenses.categories.${e.category}`).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || e.category === categoryFilter;
        
        // Date parsing
        let matchesDate = true;
        if (dateRange.start || dateRange.end) {
            const expenseDate = new Date(e.created_at);
            const start = dateRange.start ? new Date(dateRange.start) : new Date('2000-01-01');
            const end = dateRange.end ? new Date(dateRange.end) : new Date();
            end.setHours(23, 59, 59, 999);
            matchesDate = expenseDate >= start && expenseDate <= end;
        }

        return matchesSearch && matchesCategory && matchesDate;
    });

    const totalFilteredAmount = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

    const formatPrice = (price) => `${Number(price).toLocaleString()} ${t('common.currency')}`;

    return (
        <AdminGuard>
            <div className="h-full flex flex-col gap-6 overflow-hidden">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-none">
                    <div>
                        <h1 className="text-2xl font-bold text-coffee-900 dark:text-gray-100 flex items-center gap-2">
                            <ClipboardText size={32} className="text-orange-500" />
                            {t('expenses.title') || "Expense Management"}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Record and track your business expenses
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700 flex-1 md:flex-none md:w-48">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('expenses.total') || "Total Expenses"}</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{formatPrice(totalExpenses)}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700 flex-1 md:flex-none md:w-48">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Count</p>
                            <p className="text-xl font-bold text-gray-700 dark:text-gray-200 mt-1">{expenses.length}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden">
                    {/* Add Expense Form (Left Panel) */}
                    <div className="w-full md:w-80 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700 flex flex-col flex-none overflow-y-auto">
                        <h2 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                            <Plus size={20} className="text-coffee-600" />
                            {t('expenses.add_expense') || "Add New Expense"}
                        </h2>
                        
                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <Input
                                label={t('expenses.description') || "Description"}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="e.g. Coffee beans, Rent..."
                                required
                            />

                            <div className="space-y-1">
                                <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300">
                                    {t('expenses.category') || "Category"}
                                </label>
                                <select
                                    className="w-full p-3 bg-gray-50 dark:bg-[#2a3040] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-200 outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500 transition-all"
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                >
                                    {['Rent', 'Salaries', 'Ingredients', 'Utilities', 'Other'].map(cat => (
                                        <option key={cat} value={cat}>
                                            {t(`expenses.categories.${cat}`) || cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Input
                                label={t('expenses.amount') || "Amount"}
                                type="number"
                                step="any"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="e.g. 50000"
                                required
                            />

                            <Input
                                label={t('expenses.date') || "Date"}
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />

                            <Button type="submit" className="w-full mt-2">
                                {t('common.add') || "Add Expense"}
                            </Button>
                        </form>
                    </div>

                    {/* Expenses List & Filters (Right Panel) */}
                    <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-coffee-100 dark:border-gray-700 flex flex-col overflow-hidden">
                        {/* Filters Bar */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-coffee-100 dark:border-gray-700 flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="w-full md:w-72">
                                    <Input
                                        placeholder={t('common.search') || "Search..."}
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
                                    {/* Category Filter */}
                                    <select
                                        className="p-3 bg-white dark:bg-[#2a3040] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-200 outline-none text-sm"
                                        value={categoryFilter}
                                        onChange={e => setCategoryFilter(e.target.value)}
                                    >
                                        <option value="All">{t('categories.All') || "All Categories"}</option>
                                        {['Rent', 'Salaries', 'Ingredients', 'Utilities', 'Other'].map(cat => (
                                            <option key={cat} value={cat}>
                                                {t(`expenses.categories.${cat}`) || cat}
                                            </option>
                                        ))}
                                    </select>

                                    {/* Reset Filters */}
                                    {(searchQuery || categoryFilter !== 'All' || dateRange.start || dateRange.end) && (
                                        <button 
                                            onClick={() => {
                                                setSearchQuery('');
                                                setCategoryFilter('All');
                                                setDateRange({ start: '', end: '' });
                                            }}
                                            className="text-gray-500 hover:text-coffee-600 flex items-center gap-1 text-sm font-semibold transition-colors"
                                        >
                                            <ArrowCounterClockwise size={18} />
                                            Reset
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Date range filters */}
                            <div className="flex flex-wrap items-center gap-3 text-sm border-t border-gray-200 dark:border-gray-700/50 pt-3">
                                <span className="font-semibold text-gray-500 flex items-center gap-1">
                                    <Funnel size={18} /> Filters:
                                </span>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        className="p-2 bg-white dark:bg-[#2a3040] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-200 text-xs outline-none"
                                        value={dateRange.start}
                                        onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                    <span className="text-gray-400">to</span>
                                    <input 
                                        type="date" 
                                        className="p-2 bg-white dark:bg-[#2a3040] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-200 text-xs outline-none"
                                        value={dateRange.end}
                                        onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>

                                {filteredExpenses.length !== expenses.length && (
                                    <span className="text-xs bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 px-2 py-1 rounded-full font-bold ml-auto">
                                        Filtered Total: {formatPrice(totalFilteredAmount)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Expenses Table */}
                        <div className="flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex items-center justify-center h-48">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                                </div>
                            ) : filteredExpenses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500 p-4">
                                    <ClipboardText size={48} className="mb-2 opacity-50" />
                                    <p>{t('expenses.no_expenses') || "No expenses found."}</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-coffee-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold sticky top-0 z-10">
                                            <th className="p-4">{t('expenses.description') || "Description"}</th>
                                            <th className="p-4">{t('expenses.category') || "Category"}</th>
                                            <th className="p-4">{t('expenses.date') || "Date"}</th>
                                            <th className="p-4 text-right">{t('expenses.amount') || "Amount"}</th>
                                            <th className="p-4 text-center w-20">{t('common.actions') || "Actions"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                        {filteredExpenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/20 text-gray-800 dark:text-gray-200 transition-colors">
                                                <td className="p-4 font-medium max-w-xs truncate">{exp.description}</td>
                                                <td className="p-4">
                                                    <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                        {t(`expenses.categories.${exp.category}`) || exp.category}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-gray-500 dark:text-gray-400">
                                                    {formatDate(new Date(exp.created_at), i18n.language, t)}
                                                </td>
                                                <td className="p-4 text-right font-bold text-red-600 dark:text-red-400">
                                                    {formatPrice(exp.amount)}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleDeleteExpense(exp.id)}
                                                        className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                                    >
                                                        <Trash size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
};

export default ExpensesPage;
