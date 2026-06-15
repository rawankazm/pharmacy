import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircle, X } from '@phosphor-icons/react';
import Button from './Button';
import Input from './Input';
import { useKeyboard } from '../context/KeyboardContext';

const VoidReasonModal = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useTranslation();
    const [reason, setReason] = useState('');
    const { isVisible: isKeyboardVisible } = useKeyboard();

    useEffect(() => {
        if (isOpen) {
            setReason('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (reason.trim()) {
            onConfirm(reason.trim());
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${isKeyboardVisible ? 'pb-[320px] md:pb-[340px]' : ''}`}>
            <div
                className="bg-white dark:bg-[#1e2330] rounded-3xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 overflow-hidden"
                style={{ animation: 'modalSlideIn 0.3s ease-out forwards' }}
            >
                {/* Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-[#2a3040]/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                            <WarningCircle size={24} weight="fill" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {t('cashier.void_order') || "Void Order"}
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        <X size={20} weight="bold" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <Input
                            label={t('cashier.void_reason') || "Enter reason for voiding order:"}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t('cashier.void_reason_placeholder') || "e.g. Customer changed mind..."}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-medium"
                        >
                            {t('common.cancel') || "Cancel"}
                        </Button>
                        <Button
                            type="submit"
                            className="px-6 py-2.5 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white border-transparent shadow-lg shadow-red-500/30 transition-colors"
                            disabled={!reason.trim()}
                        >
                            {t('common.confirm') || "Confirm Void"}
                        </Button>
                    </div>
                </form>
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

export default VoidReasonModal;
