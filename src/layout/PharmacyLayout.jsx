import React from 'react';
import { Outlet } from 'react-router-dom';
import PharmacySidebar from '../components/PharmacySidebar';
import PharmacyHeader from '../components/PharmacyHeader';

const PharmacyLayout = () => {
    return (
        <div className="w-full h-screen bg-pharmacy-bgOuter flex items-center justify-center p-6 font-sans">
            {/* Main App Container */}
            <div className="w-full h-full max-w-[1600px] bg-pharmacy-bgInner rounded-[40px] border-[6px] border-[#2B2B2B] overflow-hidden flex shadow-2xl relative">
                
                {/* Sidebar */}
                <PharmacySidebar />

                {/* Right Content Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                    <PharmacyHeader />
                    
                    {/* Dashboard/Page Content */}
                    <main className="flex-1 overflow-y-auto px-8 pb-8 no-scrollbar">
                        <Outlet />
                    </main>
                </div>
                
                {/* Decorative gradients / blobs if any, can go here */}
            </div>
        </div>
    );
};

export default PharmacyLayout;
