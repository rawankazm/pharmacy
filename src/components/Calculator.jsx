
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Backspace } from '@phosphor-icons/react';

const Calculator = ({ onClose }) => {
    const { t } = useTranslation();
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    const handleClick = (value) => {
        setInput((prev) => prev + value);
    };

    const handleClear = () => {
        setInput('');
        setResult('');
    };

    const handleDelete = () => {
        setInput((prev) => prev.slice(0, -1));
    };

    const handleCalculate = () => {
        try {
            // eslint-disable-next-line no-eval
            const res = eval(input);
            setResult(res);
        } catch (error) {
            setResult(t('cashier.calculator.error'));
        }
    };

    const buttons = [
        '7', '8', '9', '/',
        '4', '5', '6', '*',
        '1', '2', '3', '-',
        '0', '.', '=', '+'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-80 animate-fade-in-up">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('cashier.calculator.title')}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl mb-4 text-right">
                    <div className="text-gray-500 dark:text-gray-400 text-sm h-5">{input || '0'}</div>
                    <div className="text-3xl font-bold text-gray-800 dark:text-white mt-1 h-10 overflow-hidden">{result || input || '0'}</div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    <button onClick={handleClear} className="col-span-2 p-3 rounded-xl bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">AC</button>
                    <button onClick={handleDelete} className="p-3 rounded-xl bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center"><Backspace size={20} /></button>
                    <button onClick={() => handleClick('/')} className="p-3 rounded-xl bg-coffee-100 text-coffee-600 dark:bg-coffee-900/30 dark:text-coffee-400 font-bold hover:bg-coffee-200 dark:hover:bg-coffee-900/50 transition-colors">÷</button>

                    {['7', '8', '9'].map(num => (
                        <button key={num} onClick={() => handleClick(num)} className="p-3 rounded-xl bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm">{num}</button>
                    ))}
                    <button onClick={() => handleClick('*')} className="p-3 rounded-xl bg-coffee-100 text-coffee-600 dark:bg-coffee-900/30 dark:text-coffee-400 font-bold hover:bg-coffee-200 dark:hover:bg-coffee-900/50 transition-colors">×</button>

                    {['4', '5', '6'].map(num => (
                        <button key={num} onClick={() => handleClick(num)} className="p-3 rounded-xl bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm">{num}</button>
                    ))}
                    <button onClick={() => handleClick('-')} className="p-3 rounded-xl bg-coffee-100 text-coffee-600 dark:bg-coffee-900/30 dark:text-coffee-400 font-bold hover:bg-coffee-200 dark:hover:bg-coffee-900/50 transition-colors">-</button>

                    {['1', '2', '3'].map(num => (
                        <button key={num} onClick={() => handleClick(num)} className="p-3 rounded-xl bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm">{num}</button>
                    ))}
                    <button onClick={() => handleClick('+')} className="p-3 rounded-xl bg-coffee-100 text-coffee-600 dark:bg-coffee-900/30 dark:text-coffee-400 font-bold hover:bg-coffee-200 dark:hover:bg-coffee-900/50 transition-colors">+</button>

                    <button onClick={() => handleClick('0')} className="col-span-2 p-3 rounded-xl bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm">0</button>
                    <button onClick={() => handleClick('.')} className="p-3 rounded-xl bg-gray-50 text-gray-800 dark:bg-gray-700 dark:text-gray-200 font-bold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-sm">.</button>
                    <button onClick={handleCalculate} className="p-3 rounded-xl bg-coffee-500 text-white font-bold hover:bg-coffee-600 transition-colors shadow-lg shadow-coffee-500/30">=</button>
                </div>
            </div>
        </div>
    );
};

export default Calculator;
