import React from 'react';
import { MagnifyingGlass, Question, SquaresFour } from '@phosphor-icons/react';

const PharmacyHeader = () => {
    return (
        <header className="w-full h-[80px] flex items-center justify-between px-8 bg-transparent">
            {/* Title */}
            <div>
                <h1 className="text-3xl font-extrabold text-[#1A1D1F] tracking-tight">Pharmacy Dashboard</h1>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <MagnifyingGlass size={20} />
                    </span>
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="pl-11 pr-4 py-2.5 w-[300px] rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-400"
                    />
                </div>

                {/* Help Button */}
                <button className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors">
                    <Question size={20} weight="bold" />
                </button>

                {/* Grid Button */}
                <button className="w-10 h-10 rounded-full flex items-center justify-center bg-transparent text-[#1A1D1F] hover:bg-gray-100 transition-colors ml-2">
                    <SquaresFour size={28} weight="fill" />
                </button>
            </div>
        </header>
    );
};

export default PharmacyHeader;
