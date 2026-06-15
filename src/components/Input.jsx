import React from 'react';
import { useKeyboard } from '../context/KeyboardContext';

const Input = ({ label, className = '', onChange, ...props }) => {
    const { openKeyboard } = useKeyboard();

    const handleInteraction = (e) => {
        // Prevent opening for non-text inputs if desired, but user said "textbox"
        if (props.type === 'file' || props.type === 'checkbox' || props.type === 'radio') return;

        openKeyboard(e.target, props.type || 'default', e.target.value, onChange);

        if (props.onFocus) props.onFocus(e);
        if (props.onClick) props.onClick(e);
    };

    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
            <input
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500 focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400"
                onClick={handleInteraction}
                onFocus={handleInteraction}
                onChange={onChange}
                autoComplete="off"
                {...props}
            />
        </div>
    );
};

export default Input;
