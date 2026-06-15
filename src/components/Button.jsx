import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-coffee-500 hover:bg-coffee-600 text-white focus:ring-coffee-500",
        secondary: "bg-coffee-200 hover:bg-coffee-300 text-coffee-900 focus:ring-coffee-400 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
        danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500",
        outline: "border-2 border-coffee-800 text-coffee-800 hover:bg-coffee-50 focus:ring-coffee-800 dark:border-gray-400 dark:text-gray-300 dark:hover:bg-gray-800"
    };

    return (
        <button
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
