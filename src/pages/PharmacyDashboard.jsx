import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, Funnel, Receipt, TrendUp } from '@phosphor-icons/react';
import { fetchProducts, getCashiers, getOrders, getSales, fetchDebts } from '../api';

const MedicineInfoWidget = ({ products }) => {
    const available = products.filter(p => p.stock_quantity > 10 && p.is_available).length;
    const low = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 10 && p.is_available).length;
    const outOfStock = products.filter(p => p.stock_quantity === 0 || !p.is_available).length;

    const data = [
        { name: 'Available', value: available, color: '#00D26A' },
        { name: 'Low', value: low, color: '#FCD535' },
        { name: 'Out of Stock', value: outOfStock, color: '#F87171' },
    ];

    const total = available + low + outOfStock;

    return (
        <div className="bg-[#2B2B2B] rounded-3xl p-6 text-white relative overflow-hidden flex flex-col h-full">
            <h3 className="text-sm font-bold tracking-wider mb-4 uppercase">Medicine Info</h3>
            
            <div className="flex-1 flex items-center justify-between relative">
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
                        <span className="text-3xl font-extrabold">{total > 0 ? available : 0}</span>
                    </div>
                    {total > 0 && (
                        <>
                            <div className="absolute bottom-4 right-0 w-10 h-10 bg-[#FCD535] rounded-full flex items-center justify-center text-[#2B2B2B] font-bold border-4 border-[#2B2B2B]">
                                {low}
                            </div>
                            <div className="absolute bottom-0 right-8 w-8 h-8 bg-[#F87171] rounded-full flex items-center justify-center text-white font-bold border-4 border-[#2B2B2B] text-xs">
                                {outOfStock}
                            </div>
                        </>
                    )}
                </div>

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

const ActiveSalesmanWidget = ({ cashiers }) => {
    // Show up to 3 cashiers, and +X for the rest
    const displayCashiers = cashiers.slice(0, 3);
    const remaining = cashiers.length - 3;
    
    return (
        <div className="bg-white rounded-3xl p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold tracking-wider uppercase">Active Salesman</h3>
                <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">
                    <ArrowUpRight size={16} />
                </button>
            </div>
            
            <div className="flex items-center justify-between flex-1 mt-2">
                {displayCashiers.map((s, i) => (
                    <div key={s.id} className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-100 flex items-center justify-center bg-emerald-50 text-emerald-600 text-lg font-bold">
                            {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-gray-700">{s.name.split(' ')[0]}</span>
                    </div>
                ))}
                {remaining > 0 && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">
                            +{remaining}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const PrescriptionsWidget = ({ orders }) => {
    // Mock prescription numbers based on order count
    const count = orders.length;
    const patientCount = Math.floor(count * 0.7) || 0;
    const customerCount = count - patientCount;

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
                        <div className="text-3xl font-extrabold text-blue-600 mb-1">{patientCount}</div>
                        <div className="text-xs font-bold text-gray-700">Patient</div>
                    </div>
                    <div>
                        <div className="text-3xl font-extrabold text-rose-500 mb-1">{customerCount}</div>
                        <div className="text-xs font-bold text-gray-700">Customer</div>
                    </div>
                </div>
                
                <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-r-transparent border-t-transparent rotate-45 flex items-center justify-center">
                    <div className="rotate-[-45deg] font-bold text-lg">{count}</div>
                </div>
            </div>
        </div>
    );
};

const ExpiredWidget = ({ products }) => {
    const today = new Date();
    const expired = products.filter(p => {
        if (!p.expiry_date) return false;
        return new Date(p.expiry_date) < today;
    }).slice(0, 3); // top 3

    return (
        <div className="bg-gradient-to-br from-rose-600 to-rose-400 rounded-3xl p-6 h-full text-white flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-wider uppercase">Expired</h3>
                    <span className="bg-[#FCD535] text-[#1A1D1F] text-xs font-bold px-2 py-0.5 rounded-full">{expired.length}</span>
                </div>
                <button className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10">
                    <ArrowUpRight size={16} />
                </button>
            </div>
            
            <div className="flex-1 flex flex-col justify-between mt-2">
                {expired.length > 0 ? expired.map((item, i) => (
                    <div key={item.id || i} className="flex justify-between items-center border-b border-white/20 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0">
                        <span className="text-sm truncate mr-2">{item.name}</span>
                        <span className="text-xs font-medium whitespace-nowrap">{new Date(item.expiry_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
                )) : (
                    <div className="text-sm text-white/80">No expired items.</div>
                )}
            </div>
        </div>
    );
};

const ExpiringSoonWidget = ({ products }) => {
    const today = new Date();
    const nextThreeMonths = new Date();
    nextThreeMonths.setMonth(today.getMonth() + 3);

    const expiringSoon = products.filter(p => {
        if (!p.expiry_date) return false;
        const exp = new Date(p.expiry_date);
        return exp >= today && exp <= nextThreeMonths;
    });

    const byMonth = {};
    expiringSoon.forEach(p => {
        const d = new Date(p.expiry_date);
        const monthName = d.toLocaleDateString('en-GB', { month: 'short' });
        byMonth[monthName] = (byMonth[monthName] || 0) + 1;
    });

    const months = Object.keys(byMonth);

    return (
        <div className="bg-gradient-to-br from-orange-400 to-rose-400 rounded-3xl p-6 h-full text-white flex flex-col">
             <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-wider uppercase">Expiring Soon</h3>
                    <span className="bg-[#1A1D1F] text-white text-xs font-bold px-2 py-0.5 rounded-full">{expiringSoon.length}</span>
                </div>
                <button className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10">
                    <ArrowUpRight size={16} />
                </button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-auto">
                {months.length > 0 ? months.map((m, i) => (
                    <button key={m} className={`px-4 py-2 rounded-full text-sm font-bold ${i === 1 ? 'bg-white text-[#1A1D1F]' : 'bg-white/20'}`}>
                        {m} ({byMonth[m]})
                    </button>
                )) : (
                    <div className="text-sm">No items expiring soon.</div>
                )}
            </div>
        </div>
    );
}

const RecentOrdersWidget = ({ orders }) => {
    const recent = orders.slice(0, 5); // top 5
    
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
                        <button key={tab} className={`px-4 py-1.5 rounded-full text-xs font-bold ${i === 0 ? 'bg-[#FCEB55] text-[#1A1D1F]' : 'text-gray-400 border border-gray-200 border-dashed hover:bg-gray-50'}`}>
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
                            <th className="font-normal pb-3">Order ID</th>
                            <th className="font-normal pb-3">Amount</th>
                            <th className="font-normal pb-3">Status</th>
                            <th className="font-normal pb-3 text-right">Sale Now</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recent.map((order, i) => (
                            <tr key={order.id || i} className="group border-b border-gray-50 last:border-0">
                                <td className="py-2.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">
                                            #{order.id?.toString().slice(-3) || '000'}
                                        </div>
                                        <span className="font-bold text-gray-700">Order {order.id}</span>
                                    </div>
                                </td>
                                <td className="py-2.5 font-bold text-gray-600">{order.total?.toLocaleString() || 0} د.ع</td>
                                <td className={`py-2.5 font-bold text-blue-500`}>{order.status || 'Done'}</td>
                                <td className="py-2.5 text-right">
                                    <button className="px-4 py-1.5 rounded-full border border-gray-200 border-dashed text-xs font-bold text-gray-500 hover:bg-gray-50">Sale Now</button>
                                </td>
                            </tr>
                        ))}
                        {recent.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-4 text-gray-500">No recent orders</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StockAlertWidget = ({ products }) => {
    const alerts = products.filter(p => p.stock_quantity <= 10).slice(0, 5);
    
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
                        <button key={tab} className={`px-4 py-1.5 rounded-full text-xs font-bold ${i === 0 ? 'bg-[#FCEB55] text-[#1A1D1F]' : 'text-gray-400 border border-gray-200 border-dashed hover:bg-gray-50'}`}>
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
                            <th className="font-normal pb-3">Product Name</th>
                            <th className="font-normal pb-3 text-center">Category</th>
                            <th className="font-normal pb-3 text-center">Stock</th>
                            <th className="font-normal pb-3 text-center">Barcode</th>
                            <th className="font-normal pb-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alerts.map((alert, i) => (
                            <tr key={alert.id || i} className="border-b border-gray-50 last:border-0">
                                <td className="py-3 font-bold text-gray-700 truncate max-w-[150px]">{alert.name}</td>
                                <td className="py-3 text-center font-bold text-gray-600 text-xs truncate max-w-[100px]">{alert.category}</td>
                                <td className="py-3 text-center">
                                    <span className={`px-3 py-1 rounded-md text-xs font-bold ${alert.stock_quantity === 0 ? 'bg-rose-500 text-white' : 'bg-pharmacy-activeYellow text-[#1A1D1F]'}`}>
                                        {alert.stock_quantity}
                                    </span>
                                </td>
                                <td className="py-3 text-center font-bold text-gray-700 text-xs">{alert.barcode || '-'}</td>
                                <td className="py-3 text-right">
                                    <button className={`px-3 py-1 rounded-full text-xs font-bold ${alert.stock_quantity === 0 ? 'bg-pharmacy-activeYellow text-[#1A1D1F]' : 'border border-gray-200 border-dashed text-gray-500'}`}>
                                        {alert.stock_quantity === 0 ? 'Requested' : 'Order Now'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {alerts.length === 0 && (
                            <tr>
                                <td colSpan="5" className="text-center py-4 text-gray-500">No stock alerts</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FinancialStatsWidget = ({ sales, debts }) => {
    const totalInvoices = sales.length;
    const totalPaid = sales.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const totalDues = debts.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

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
                        <div className="text-2xl font-extrabold text-blue-500">{totalInvoices.toLocaleString()}</div>
                    </div>
                </div>
                
                <div className="flex flex-col items-end">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Paid</div>
                    <div className="text-xl font-extrabold text-[#00D26A]">{totalPaid.toLocaleString()}</div>
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
                <div className="text-xl font-extrabold text-orange-400">0</div>
            </div>

            <div className="grid grid-rows-2 gap-4">
                {/* Dues */}
                <div className="bg-white rounded-3xl p-4 flex items-center justify-between">
                    <div className="w-8 h-8 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center font-bold text-xs">t</div>
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Dues</div>
                        <div className="text-lg font-extrabold text-rose-500">{totalDues > 0 ? (totalDues / 1000).toFixed(0) + 'k' : 0}</div>
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
                        <div className="text-lg font-extrabold text-purple-600">0</div>
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
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [cashiers, setCashiers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [sales, setSales] = useState([]);
    const [debts, setDebts] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [prodRes, cashRes, ordRes, salesRes, debtRes] = await Promise.all([
                    fetchProducts(),
                    getCashiers(),
                    getOrders(),
                    getSales(),
                    fetchDebts()
                ]);

                if (prodRes.data) setProducts(prodRes.data);
                if (cashRes.data) setCashiers(cashRes.data);
                if (ordRes.data) setOrders(ordRes.data);
                if (salesRes.data) setSales(salesRes.data);
                if (debtRes.data) setDebts(debtRes.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1D1F]"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[700px]">
            {/* Column 1 */}
            <div className="col-span-4 flex flex-col gap-6">
                <div className="h-[280px]">
                    <MedicineInfoWidget products={products} />
                </div>
                <div className="flex-1">
                    <StockAlertWidget products={products} />
                </div>
            </div>

            {/* Column 2 */}
            <div className="col-span-3 flex flex-col gap-6">
                <div className="h-[130px]">
                    <ActiveSalesmanWidget cashiers={cashiers} />
                </div>
                <div className="h-[130px]">
                    <PrescriptionsWidget orders={orders} />
                </div>
                <div className="flex-1">
                    <ExpiredWidget products={products} />
                </div>
                <div className="h-[180px]">
                    <ExpiringSoonWidget products={products} />
                </div>
            </div>

            {/* Column 3 */}
            <div className="col-span-5 flex flex-col gap-6">
                <div className="flex-1">
                    <RecentOrdersWidget orders={orders} />
                </div>
                <div className="h-[200px]">
                    <FinancialStatsWidget sales={sales} debts={debts} />
                </div>
            </div>
        </div>
    );
}
