import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Funnel, Receipt, TrendUp } from '@phosphor-icons/react';

const MedicineInfoWidget = () => {
    const data = [
        { name: 'Available', value: 3038, color: '#00D26A' },
        { name: 'Low', value: 33, color: '#FCD535' },
        { name: 'Out of Stock', value: 4, color: '#F87171' },
    ];

    return (
        <div className="bg-[#2B2B2B] rounded-3xl p-6 text-white relative overflow-hidden flex flex-col h-full">
            <h3 className="text-sm font-bold tracking-wider mb-4 uppercase">Medicine Info</h3>
            
            <div className="flex-1 flex items-center justify-between relative">
                {/* Chart Area */}
                <div className="w-[180px] h-[180px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={0}
                                outerRadius={80}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-extrabold">{data[0].value}</span>
                    </div>
                    {/* Floating badges */}
                    <div className="absolute bottom-4 right-0 w-10 h-10 bg-[#FCD535] rounded-full flex items-center justify-center text-[#2B2B2B] font-bold border-4 border-[#2B2B2B]">
                        {data[1].value}
                    </div>
                    <div className="absolute bottom-0 right-8 w-8 h-8 bg-[#F87171] rounded-full flex items-center justify-center text-white font-bold border-4 border-[#2B2B2B] text-xs">
                        {data[2].value}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-4">
                    {data.map(item => (
                        <div key={item.name} className="flex items-center gap-3">
                            <div className="w-4 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-gray-300">{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ActiveSalesmanWidget = () => {
    const salesmen = [
        { name: 'Mainul', img: 'https://i.pravatar.cc/150?u=mainul' },
        { name: 'Zisan', img: 'https://i.pravatar.cc/150?u=zisan' },
        { name: 'Shakil', img: 'https://i.pravatar.cc/150?u=shakil' },
    ];
    
    return (
        <div className="bg-white rounded-3xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold tracking-wider uppercase">Active Salesman</h3>
                <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                    <ArrowUpRight size={16} />
                </button>
            </div>
            
            <div className="flex items-center justify-between flex-1 mt-2">
                {salesmen.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100">
                            <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-gray-700">{s.name}</span>
                    </div>
                ))}
                <div className="flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">
                        +3
                    </div>
                </div>
            </div>
        </div>
    );
};

const PrescriptionsWidget = () => {
    return (
        <div className="bg-pharmacy-activeYellow rounded-3xl p-6 h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold tracking-wider uppercase text-[#1A1D1F]">Prescriptions</h3>
                <button className="w-8 h-8 rounded-full border border-[#1A1D1F]/20 flex items-center justify-center text-[#1A1D1F] hover:bg-[#1A1D1F]/10">
                    <ArrowUpRight size={16} />
                </button>
            </div>
            
            <div className="flex justify-between items-end flex-1">
                <div className="flex gap-6">
                    <div>
                        <div className="text-3xl font-extrabold text-blue-600 mb-1">25</div>
                        <div className="text-xs font-bold text-gray-700">Patient</div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-rose-500 mb-1">25</div>
                        <div className="text-xs font-bold text-gray-700">Customer</div>
                    </div>
                </div>
                
                {/* Circular Progress Mock */}
                <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-r-transparent border-t-transparent rotate-45 flex items-center justify-center">
                    <div className="rotate-[-45deg] font-bold text-lg">35</div>
                </div>
            </div>
        </div>
    );
};

const ExpiredWidget = () => {
    return (
        <div className="bg-gradient-to-br from-rose-600 to-rose-400 rounded-3xl p-6 h-full text-white flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-wider uppercase">Expired</h3>
                    <span className="bg-[#FCD535] text-[#1A1D1F] text-xs font-bold px-2 py-0.5 rounded-full">3</span>
                </div>
                <button className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10">
                    <ArrowUpRight size={16} />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-between mt-2">
                {[
                    { name: 'Allegra 180 mg', date: '08 Jul' },
                    { name: 'Alarid 0.03%', date: '08 Jul' },
                    { name: 'Anaflex SR 500 mg', date: '08 Jul' },
                ].map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-white/20 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-xs font-medium">{item.date}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ExpiringSoonWidget = () => {
    return (
        <div className="bg-gradient-to-br from-orange-400 to-rose-400 rounded-3xl p-6 h-full text-white flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-wider uppercase">Expiring Soon</h3>
                    <span className="bg-[#1A1D1F] text-white text-xs font-bold px-2 py-0.5 rounded-full">34</span>
                </div>
                <button className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10">
                    <ArrowUpRight size={16} />
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-auto">
                <button className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold">July (4)</button>
                <button className="bg-white text-[#1A1D1F] px-4 py-2 rounded-full text-sm font-bold">August (17)</button>
                <button className="bg-white px-4 py-2 rounded-full text-sm font-bold text-[#1A1D1F] mt-2">September (2)</button>
                <button className="bg-white/20 px-4 py-2 rounded-full text-sm font-bold mt-2">Novem...</button>
            </div>
        </div>
    );
}

const RecentOrdersWidget = () => {
    const orders = [
        { patient: 'Amir', img: 'https://i.pravatar.cc/150?u=1', by: 'Dr. Ayrin', form: 'OPD', color: 'text-blue-500' },
        { patient: 'Zafor', img: 'https://i.pravatar.cc/150?u=2', by: 'Dr. Habib', form: 'IPD', color: 'text-orange-500' },
        { patient: 'Shoyeb', img: 'https://i.pravatar.cc/150?u=3', by: 'Dr. Malek', form: 'OT', color: 'text-green-500' },
        { patient: 'Kamran', img: 'https://i.pravatar.cc/150?u=4', by: 'Dr. Akash', form: 'OPD', color: 'text-blue-500' },
        { patient: 'Zinia', img: 'https://i.pravatar.cc/150?u=5', by: 'Dr. Habib', form: 'IPD', color: 'text-orange-500' },
    ];
    
    return (
        <div className="bg-white rounded-3xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold tracking-wider uppercase">Recent Orders</h3>
                <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                    <Funnel size={16} />
                </button>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <div className="flex gap-2">
                    {['ALL', 'OPD', 'IPD', 'OT'].map((tab, i) => (
                        <button key={tab} className={`px-4 py-1.5 rounded-full text-xs font-bold ${i === 0 ? 'bg-[#FCEB55] text-[#1A1D1F]' : 'text-gray-400 border border-gray-200 border-dashed'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <button className="text-xs font-bold text-gray-400">See All</button>
            </div>
            
            <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase font-medium">
                        <tr>
                            <th className="font-normal pb-3">Patient</th>
                            <th className="font-normal pb-3">Order By</th>
                            <th className="font-normal pb-3">Order Form</th>
                            <th className="font-normal pb-3 text-right">Sale Now</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order, i) => (
                            <tr key={i} className="group">
                                <td className="py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                                            <img src={order.img} alt="" />
                                        </div>
                                        <span className="font-bold text-gray-700">{order.patient}</span>
                                    </div>
                                </td>
                                <td className="py-2.5 font-bold text-gray-600">{order.by}</td>
                                <td className={`py-2.5 font-bold ${order.color}`}>{order.form}</td>
                                <td className="py-2.5 text-right">
                                    <button className="px-4 py-1.5 rounded-full border border-gray-200 border-dashed text-xs font-bold text-gray-500 hover:bg-gray-50">Sale Now</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StockAlertWidget = () => {
    const alerts = [
        { patient: 'Allevia 2.5 mg/ml', brand: 'Syndr', stock: 0, rack: 'G2804', status: 'Requested', statusColor: 'bg-pharmacy-activeYellow' },
        { patient: 'Evrysol 0.05% - Cream', brand: 'Syndr', stock: 0, rack: 'H2S03', status: 'Requested', statusColor: 'bg-pharmacy-activeYellow' },
        { patient: 'Clarifyte 0.05%', brand: 'Axon', stock: 1, rack: 'H3S02', status: 'Requested', statusColor: 'bg-pharmacy-activeYellow' },
        { patient: 'Serene 5 mg', brand: 'CuraLife', stock: 1, rack: 'G3S02', status: 'Order Now', statusColor: 'border border-gray-200 border-dashed text-gray-500' },
        { patient: 'Equilibrio', brand: 'Relivv', stock: 2, rack: 'C3S02', status: 'Order Now', statusColor: 'border border-gray-200 border-dashed text-gray-500' },
    ];
    
    return (
        <div className="bg-white rounded-3xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-sm font-bold tracking-wider uppercase">Stock Alert</h3>
                <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                    <Funnel size={16} />
                </button>
            </div>
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
                <div className="flex gap-2">
                    {['ALL', 'LOW STOCK', 'ZERO STOCK'].map((tab, i) => (
                        <button key={tab} className={`px-4 py-1.5 rounded-full text-xs font-bold ${i === 0 ? 'bg-[#FCEB55] text-[#1A1D1F]' : 'text-gray-400 border border-gray-200 border-dashed'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
                <button className="text-xs font-bold text-gray-400">See All</button>
            </div>
            
            <div className="flex-1 overflow-auto no-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] text-gray-400 uppercase tracking-wider">
                        <tr>
                            <th className="font-normal pb-3">Patient</th>
                            <th className="font-normal pb-3 text-center">Brand</th>
                            <th className="font-normal pb-3 text-center">Stock</th>
                            <th className="font-normal pb-3 text-center">Rack</th>
                            <th className="font-normal pb-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.map((alert, i) => (
                            <tr key={i} className="border-b border-gray-50 last:border-0">
                                <td className="py-3 font-bold text-gray-700">{alert.patient}</td>
                                <td className="py-3 text-center font-bold text-gray-600">{alert.brand}</td>
                                <td className="py-3 text-center">
                                    <span className={`px-3 py-1 rounded-md text-xs font-bold ${alert.stock === 0 ? 'bg-rose-500 text-white' : 'bg-pharmacy-activeYellow text-[#1A1D1F]'}`}>
                                        {alert.stock}
                                    </span>
                                </td>
                                <td className="py-3 text-center font-bold text-gray-700">{alert.rack}</td>
                                <td className="py-3 text-right">
                                    <button className={`px-3 py-1 rounded-full text-xs font-bold ${alert.statusColor}`}>
                                        {alert.status}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FinancialStatsWidget = () => {
    return (
        <div className="grid grid-cols-2 gap-4 h-full">
            {/* Invoices */}
            <div className="col-span-2 bg-white rounded-3xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                        <Receipt size={24} weight="fill" />
                    </div>
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Invoices</div>
                        <div className="text-2xl font-extrabold text-blue-500">4,623</div>
                    </div>
                </div>
                
                <div className="flex flex-col items-end">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Paid</div>
                    <div className="text-2xl font-extrabold text-[#00D26A]">7,876</div>
                </div>
            </div>
            
            {/* Discount */}
            <div className="bg-white rounded-3xl p-5 flex flex-col justify-center relative">
                <button className="absolute top-4 right-4 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                    <ArrowUpRight size={12} />
                </button>
                <div className="text-orange-400 mb-2">
                    <span className="text-2xl">%</span>
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Discount</div>
                <div className="text-xl font-extrabold text-orange-400">361</div>
            </div>

            <div className="grid grid-rows-2 gap-4">
                {/* Dues */}
                <div className="bg-white rounded-3xl p-4 flex items-center justify-between">
                    <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center font-bold text-xs">t</div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Dues</div>
                        <div className="text-lg font-extrabold text-rose-500">150</div>
                    </div>
                    <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
                         <ArrowUpRight size={12} />
                    </button>
                </div>
                
                {/* Refund */}
                <div className="bg-white rounded-3xl p-4 flex items-center justify-between">
                     <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center font-bold text-xs">t</div>
                     <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Refund</div>
                        <div className="text-lg font-extrabold text-purple-600">108</div>
                    </div>
                    <button className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400">
                         <ArrowUpRight size={12} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function PharmacyDashboard() {
    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[700px]">
            {/* Column 1 */}
            <div className="col-span-4 flex flex-col gap-6">
                <div className="h-[280px]">
                    <MedicineInfoWidget />
                </div>
                <div className="flex-1">
                    <StockAlertWidget />
                </div>
            </div>

            {/* Column 2 */}
            <div className="col-span-3 flex flex-col gap-6">
                <div className="h-[130px]">
                    <ActiveSalesmanWidget />
                </div>
                <div className="h-[130px]">
                    <PrescriptionsWidget />
                </div>
                <div className="flex-1">
                    <ExpiredWidget />
                </div>
                <div className="h-[180px]">
                    <ExpiringSoonWidget />
                </div>
            </div>

            {/* Column 3 */}
            <div className="col-span-5 flex flex-col gap-6">
                <div className="flex-1">
                    <RecentOrdersWidget />
                </div>
                <div className="h-[200px]">
                    <FinancialStatsWidget />
                </div>
            </div>
        </div>
    );
}
