import React from 'react';
import { useTranslation } from 'react-i18next';
import { WarningCircle, X } from '@phosphor-icons/react';
import Button from './Button';
import { useKeyboard } from '../context/KeyboardContext';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText,
    isDangerous = true
}) => {
    const { t } = useTranslation();
    const { isVisible: isKeyboardVisible } = useKeyboard();

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${isKeyboardVisible ? 'pb-[320px] md:pb-[340px]' : ''}`}>
            <div
                className="bg-white dark:bg-[#1e2330] rounded-3xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 overflow-hidden"
                style={{ animation: 'modalSlideIn 0.3s ease-out forwards' }}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#2a3040]/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDangerous ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            }`}>
                            <WarningCircle size={24} weight="fill" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {title || t('common.confirm_action')}
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
                <div className="p-6">
                    <p className="text-gray-600 dark:text-gray-300 text-base mb-6">
                        {message || t('common.are_you_sure')}
                    </p>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-medium"
                        >
                            {cancelText || t('common.cancel')}
                        </Button>
                        <Button
                            type="button"
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-6 py-2.5 rounded-xl font-medium text-white border-transparent shadow-lg transition-colors ${isDangerous
                                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                                }`}
                        >
                            {confirmText || t('common.confirm')}
                        </Button>
                    </div>
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

export default ConfirmModal;
