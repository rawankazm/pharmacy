import React from 'react';
import { NavLink } from 'react-router-dom';
import { House, Tote, Users, Pill, Receipt, Gear, SignOut, User } from '@phosphor-icons/react';

const PharmacySidebar = () => {
    return (
        <aside className="w-[80px] h-full flex flex-col items-center py-6 bg-transparent shrink-0">
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center">
                <span className="font-bold text-sm leading-tight text-[#2B2B2B]">Simply</span>
                <span className="font-bold text-sm leading-tight text-[#2B2B2B]">Meds</span>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col items-center gap-6 flex-1 w-full">
                <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => 
                        `p-3 rounded-full transition-colors flex justify-center items-center ${isActive ? 'bg-pharmacy-activeYellow text-[#1A1D1F]' : 'text-pharmacy-textGray hover:bg-gray-100'}`
                    }
                >
                    <House size={24} weight="fill" />
                </NavLink>

                <NavLink 
                    to="/cashier" 
                    className={({ isActive }) => 
                        `p-3 rounded-full transition-colors flex justify-center items-center ${isActive ? 'bg-pharmacy-activeYellow text-[#1A1D1F]' : 'text-pharmacy-textGray hover:bg-gray-100'}`
                    }
                >
                    <Tote size={24} weight="bold" />
                </NavLink>

                <NavLink 
                    to="/admin/products" 
                    className={({ isActive }) => 
                        `p-3 rounded-full transition-colors flex justify-center items-center ${isActive ? 'bg-pharmacy-activeYellow text-[#1A1D1F]' : 'text-pharmacy-textGray hover:bg-gray-100'}`
                    }
                >
                    <Pill size={24} weight="bold" />
                </NavLink>

                <NavLink 
                    to="/warehouse" 
                    className={({ isActive }) => 
                        `p-3 rounded-full transition-colors flex justify-center items-center ${isActive ? 'bg-pharmacy-activeYellow text-[#1A1D1F]' : 'text-pharmacy-textGray hover:bg-gray-100'}`
                    }
                >
                    <Users size={24} weight="bold" />
                </NavLink>

                <NavLink 
                    to="/shift-reports" 
                    className={({ isActive }) => 
                        `p-3 rounded-full transition-colors flex justify-center items-center ${isActive ? 'bg-pharmacy-activeYellow text-[#1A1D1F]' : 'text-pharmacy-textGray hover:bg-gray-100'}`
                    }
                >
                    <Receipt size={24} weight="bold" />
                </NavLink>
                
                <NavLink 
                    to="/settings" 
                    className={({ isActive }) => 
                        `p-3 rounded-full transition-colors flex justify-center items-center ${isActive ? 'bg-pharmacy-activeYellow text-[#1A1D1F]' : 'text-pharmacy-textGray hover:bg-gray-100'}`
                    }
                >
                    <Gear size={24} weight="bold" />
                </NavLink>
            </nav>

            {/* Bottom Actions */}
            <div className="mt-auto flex flex-col items-center gap-6 w-full">
                <button className="p-3 text-pharmacy-textGray hover:text-[#1A1D1F] transition-colors rounded-full hover:bg-gray-100">
                    <SignOut size={24} weight="bold" />
                </button>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm mt-2">
                    <img 
                        src="https://ui-avatars.com/api/?name=User&background=random" 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </aside>
    );
};

export default PharmacySidebar;
