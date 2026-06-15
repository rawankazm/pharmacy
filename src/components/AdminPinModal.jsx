import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LockKey, X, ShieldCheck } from '@phosphor-icons/react';
import Button from './Button';
import { useKeyboard } from '../context/KeyboardContext';

const AdminPinModal = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useTranslation();
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const { isVisible: isKeyboardVisible, openKeyboard } = useKeyboard();

    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pin.trim()) {
            onConfirm(pin.trim(), setError, setPin);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${isKeyboardVisible ? 'pb-[320px] md:pb-[340px]' : ''}`}>
            <div
                className="bg-white dark:bg-[#1e2330] rounded-3xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 overflow-hidden text-center flex flex-col items-center"
                style={{ animation: 'modalSlideIn 0.3s ease-out forwards' }}
            >
                {/* Header (Exit Button) */}
                <div className="w-full flex justify-end p-4 pb-0">
                    <button
                        onClick={onClose}
                        type="button"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                <div className="px-8 pb-8 w-full flex flex-col items-center mt-[-1rem]">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500 dark:text-blue-400 mx-auto mb-4">
                        <LockKey size={32} weight="fill" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {t('admin.security_check') || "Security Check"}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
                        {t('admin.enter_pin') || "Enter Admin PIN"}
                    </p>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                        <input
                            type="password"
                            value={pin}
                            onFocus={(e) => openKeyboard(e.target, 'default', pin, (evt) => {
                                setPin(evt.target.value);
                                setError(false);
                            })}
                            onChange={(e) => {
                                setPin(e.target.value);
                                setError(false);
                            }}
                            className={`text-center text-2xl tracking-widest p-3 border rounded-xl outline-none transition-all dark:text-white w-full
                                ${error
                                    ? 'border-red-300 bg-red-50 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 shadow-[inset_0_0_0_2px_rgba(239,68,68,0.2)]'
                                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900'}
                            `}
                            placeholder="••••"
                            maxLength={8}
                            autoFocus
                        />

                        {error && <p className="text-red-500 text-sm font-medium animate-pulse">{t('admin.invalid_pin') || "Invalid PIN"}</p>}

                        <div className="flex gap-3 justify-center w-full mt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-xl font-medium"
                            >
                                {t('common.cancel') || "Cancel"}
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 px-4 py-3 rounded-xl font-medium bg-blue-600 hover:bg-blue-700 text-white border-transparent shadow-lg shadow-blue-500/30 transition-colors flex items-center justify-center gap-2"
                                disabled={!pin}
                            >
                                <ShieldCheck size={20} />
                                {t('common.confirm') || "Confirm"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            <style>{`
                @keyframes modalSlideIn {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default AdminPinModal;
