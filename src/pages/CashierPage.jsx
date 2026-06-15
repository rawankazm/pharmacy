import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import { api, getCashiers, fetchProducts, getOrders, updateOrder, getSales, fetchExpenses } from '../api';
import { CheckCircle, Clock, Receipt, Pencil, User, SignOut, Calculator as CalculatorIcon, Trash, TrendUp, Plus, X, CreditCard, ShoppingCart, MagnifyingGlass, Lock, CurrencyDollar } from '@phosphor-icons/react';
import Button from '../components/Button';
import Input from '../components/Input';
import Calculator from '../components/Calculator';
import CashierReportModal from '../components/CashierReportModal';
import EndShiftModal from '../components/EndShiftModal';
import VoidReasonModal from '../components/VoidReasonModal';
import { formatDate, formatTime } from '../utils/dateFormatter';
import { useKeyboard } from '../context/KeyboardContext';

const getUnitText = (desc, count, t) => {
    const unitKey = desc && ['piece', 'carton', 'kilo', 'pack'].includes(desc.toLowerCase())
        ? desc.toLowerCase()
        : 'piece';
    return t(`units.${unitKey}`) || unitKey;
};

const IQD_DENOMINATIONS = [
    { value: 50000, img: '/iqd_50000.jpg', label: '٥٠,٠٠٠' },
    { value: 25000, img: '/iqd_25000.jpg', label: '٢٥,٠٠٠' },
    { value: 10000, img: '/iqd_10000.jpg', label: '١٠,٠٠٠' },
    { value: 5000, img: '/iqd_5000.jpg', label: '٥,٠٠٠' },
    { value: 1000, img: '/iqd_1000.jpg', label: '١,٠٠٠' },
    { value: 500, img: '/iqd_500.jpg', label: '٥٠٠' },
    { value: 250, img: '/iqd_250.jpg', label: '٢٥٠' }
];

const getChangeNotes = (amount) => {
    let remaining = amount;
    const notes = [];
    for (const note of IQD_DENOMINATIONS) {
        const count = Math.floor(remaining / note.value);
        if (count > 0) {
            notes.push({ ...note, count });
            remaining = remaining % note.value;
        }
    }
    return notes;
};

const getCategoryEmoji = (category) => {
    if (!category) return '📦';
    switch (category.toLowerCase()) {
        case 'beverages': return '🥤';
        case 'snacks & sweets': return '🍿';
        case 'dairy & cheese': return '🧀';
        case 'pantry & grains': return '🍚';
        case 'bakery': return '🍞';
        case 'household & cleaning': return '🧼';
        case 'fresh produce':
        case 'fruits & vegetables': return '🍎';
        case 'meats':
        case 'meat & fish': return '🥩';
        default: return '📦';
    }
};

const CashierPage = () => {
    const { t, i18n } = useTranslation();
    const { openKeyboard } = useKeyboard();
    const formatPrice = (price) => `${Number(price).toLocaleString()} ${t('common.currency')}`;
    const socket = useSocket();

    const storeName = localStorage.getItem('appName') || 'MarketPOS';
    const storeAddress = localStorage.getItem('storeAddress') || '';
    const storePhone = localStorage.getItem('storePhone') || '';

    const [activeOrders, setActiveOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [barcodeSearch, setBarcodeSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    const calculateOrderTotalWithDiscounts = (items) => {
        if (!items) return 0;
        let subtotal = 0;
        let discount = 0;
        items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            if (item.note) {
                if (item.note.includes('٪٥') || item.note.includes('5%')) {
                    discount += itemTotal * 0.05;
                } else if (item.note.includes('٪١٠') || item.note.includes('10%')) {
                    discount += itemTotal * 0.10;
                } else if (item.note.includes('بەلاش') || item.note.includes('Free')) {
                    discount += itemTotal;
                }
            }
        });
        return Math.max(0, subtotal - discount);
    };

    const getOrderSummary = (order) => {
        if (!order || !order.items) return { subtotal: 0, discount: 0, tax: 0, total: 0 };
        let subtotal = 0;
        let discount = 0;
        order.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            if (item.note) {
                if (item.note.includes('٪٥') || item.note.includes('5%')) {
                    discount += itemTotal * 0.05;
                } else if (item.note.includes('٪١٠') || item.note.includes('10%')) {
                    discount += itemTotal * 0.10;
                } else if (item.note.includes('بەلاش') || item.note.includes('Free')) {
                    discount += itemTotal;
                }
            }
        });
        const tax = 0;
        const total = Math.max(0, subtotal - discount + tax);
        return { subtotal, discount, tax, total };
    };

    // Login State
    const [currentUser, setCurrentUser] = useState(null);
    const [cashiersList, setCashiersList] = useState([]);
    const [loginPin, setLoginPin] = useState('');
    const [selectedLoginId, setSelectedLoginId] = useState('');
    const [loginError, setLoginError] = useState(false);
    const [tempLoggedInUser, setTempLoggedInUser] = useState(null);
    const [startingCash, setStartingCash] = useState('0');

    const [showCalculator, setShowCalculator] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showEndShiftModal, setShowEndShiftModal] = useState(false);
    const [showVoidModal, setShowVoidModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);

    // Payment & Debt Checkout State
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
    const [debtCustomerName, setDebtCustomerName] = useState('');
    const [debtCustomerPhone, setDebtCustomerPhone] = useState('');
    const [existingDebtors, setExistingDebtors] = useState([]);
    const [isNewDebtCustomer, setIsNewDebtCustomer] = useState(true);
    const [receivedAmount, setReceivedAmount] = useState('');

    useEffect(() => {
        // Check session
        const storedUser = sessionStorage.getItem('activeCashier');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        // Load Cashiers List
        loadCashiers();
    }, []);

    const loadDebtors = async () => {
        try {
            const { data } = await api.get('/debts');
            if (data) {
                const uniqueDebtors = [];
                const seen = new Set();
                data.forEach(d => {
                    const key = `${d.customer_name.trim()}-${d.customer_phone.trim()}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        uniqueDebtors.push({ name: d.customer_name.trim(), phone: d.customer_phone.trim() });
                    }
                });
                setExistingDebtors(uniqueDebtors);
            }
        } catch (error) {
            console.error("Failed to load debtors", error);
            const mockDebts = JSON.parse(localStorage.getItem('mockDebts') || '[]');
            const uniqueDebtors = [];
            const seen = new Set();
            mockDebts.forEach(d => {
                const key = `${d.customer_name.trim()}-${d.customer_phone.trim()}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueDebtors.push({ name: d.customer_name.trim(), phone: d.customer_phone.trim() });
                }
            });
            setExistingDebtors(uniqueDebtors);
        }
    };

    useEffect(() => {
        if (showPaymentModal) {
            loadDebtors();
        }
    }, [showPaymentModal]);

    const loadCashiers = async () => {
        try {
            const { data } = await getCashiers();
            setCashiersList(data);
            if (data.length > 0 && !selectedLoginId) {
                setSelectedLoginId(data[0].id);
            }
        } catch (error) {
            // fallback
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const cashier = cashiersList.find(c => c.id == selectedLoginId);
        if (cashier && cashier.code === loginPin) {
            setTempLoggedInUser(cashier);
            const lastClosing = localStorage.getItem('last_closing_cash') || '0';
            setStartingCash(lastClosing);
            setLoginPin('');
            setLoginError(false);
        } else {
            setLoginError(true);
            setLoginPin('');
        }
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setSelectedOrder(null);
        sessionStorage.removeItem('activeCashier');
    };

    const loadOrders = async () => {
        try {
            const [ordersRes, prodRes] = await Promise.all([getOrders(), fetchProducts()]);
            setActiveOrders(ordersRes.data.filter(o => o.status === 'pending'));
            setAllProducts(prodRes.data || []);

            // Check for low stock products
            const lowStockProducts = (prodRes.data || []).filter(p => (p.track_stock === true || p.track_stock === 1) && Number(p.stock_quantity) < 5 && Number(p.stock_quantity) > 0);
            if (lowStockProducts.length > 0) {
                const names = lowStockProducts.map(p => i18n.language === 'ckb' ? (p.name_ckb || p.name) : p.name).join(', ');
                toast.error(`${t('stock.low_stock') || 'Low Stock'}: ${names}`, { duration: 4000, icon: '⚠️' });
            }
        } catch (error) {
            console.error("Failed to load orders/products", error);
            // Mock Orders
            const localOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
            const staticMockOrders = [];

            // Check if static orders are already in "paid" sales to hide them?
            const sales = JSON.parse(localStorage.getItem('mockSales') || '[]');
            const paidIds = sales.map(s => s.id);
            const visibleStatic = staticMockOrders.filter(o => !paidIds.includes(o.id));

            const allMockOrders = [...localOrders, ...visibleStatic].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setActiveOrders(allMockOrders);

            // Try to load products from local mock or generic if failed
            try {
                const prodRes = await fetchProducts();
                setAllProducts(prodRes.data || []);
                const lowStockProducts = (prodRes.data || []).filter(p => (p.track_stock === true || p.track_stock === 1) && Number(p.stock_quantity) < 5 && Number(p.stock_quantity) > 0);
                if (lowStockProducts.length > 0) {
                    const names = lowStockProducts.map(p => i18n.language === 'ckb' ? (p.name_ckb || p.name) : p.name).join(', ');
                    toast.error(`${t('stock.low_stock') || 'Low Stock'}: ${names}`, { duration: 4000, icon: '⚠️' });
                }
            } catch (pErr) {
                console.error("Failed to load products in fallback:", pErr);
            }
        }
    };

    useEffect(() => {
        loadOrders();

        if (socket) {
            socket.on('new-order', (order) => {
                setActiveOrders(prev => [order, ...prev]);
                // Play notification sound?
                new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(e => console.log(e));
            });

            socket.on('order-paid', ({ id }) => {
                setActiveOrders(prev => prev.filter(o => o.id !== parseInt(id)));
                if (selectedOrder && selectedOrder.id === parseInt(id)) {
                    setSelectedOrder(null);
                }
            });
        }

        return () => {
            if (socket) {
                socket.off('new-order');
                socket.off('order-paid');
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket]);

    // Listen for cross-tab updates (Demo Mode)
    useEffect(() => {
        const handleStorageChange = () => {
            loadOrders();
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // ⌨️ Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only when not typing in an input
            const tag = e.target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

            if (e.key === 'F2') {
                e.preventDefault();
                // New order — focus on first available table or create takeaway
                toast(`${t('cashier.new_order') || '🆕 ئۆردەری نوێ'} — F2`, { icon: '⌨️', duration: 1500 });
                setShowProductModal(true);
            }
            if (e.key === 'F4') {
                e.preventDefault();
                if (selectedOrder && selectedOrder.items?.length > 0) {
                    startCheckout();
                } else {
                    toast.error(t('cashier.select_order') || 'ئۆردەرێک هەڵبژێرە', { duration: 1500 });
                }
            }
            if (e.key === 'Escape') {
                setShowPaymentModal(false);
                setShowCalculator(false);
                setShowProductModal(false);
                setShowVoidModal(false);
                setShowReportModal(false);
            }
            if (e.key === 'F1') {
                e.preventDefault();
                setShowCalculator(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedOrder, t]);

    const handleUpdateQty = async (orderId, itemIdx, change) => {
        const order = activeOrders.find(o => o.id === orderId);
        if (!order) return;

        const newItems = [...order.items];
        const item = { ...newItems[itemIdx] };
        
        if (change > 0) {
            const pRef = allProducts.find(p => p.id === item.product_id);
            if (pRef && (pRef.track_stock === true || pRef.track_stock === 1) && (item.quantity + change) > Number(pRef.stock_quantity)) {
                toast.error(`${t('stock.low_stock') || "Low Stock"}: ${pRef.stock_quantity} maximum.`);
                return;
            }
        }
        
        item.quantity += change;

        if (item.quantity <= 0) {
            newItems.splice(itemIdx, 1);
        } else {
            newItems[itemIdx] = item;
        }

        const newTotal = calculateOrderTotalWithDiscounts(newItems);

        // Optimistic UI Update
        const updatedOrder = { ...order, items: newItems, total_amount: newTotal };
        setActiveOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
        setSelectedOrder(updatedOrder);

        try {
            await updateOrder(orderId, {
                items: newItems,
                total_amount: newTotal
            });
        } catch (error) {
            console.error("Failed to update order qty:", error);
            // Revert on fail? For now just alert or log
            // alert(t('common.error')); 
        }
    };

    const handleNewTakeaway = async () => {
        try {
            const newOrder = {
                table_id: null,
                items: [],
                total_amount: 0,
                status: 'pending'
            };
            const { data } = await api.post('/orders', newOrder);
            const created = (data && data.length > 0) ? data[0] : { ...newOrder, id: Date.now(), created_at: new Date() };

            setActiveOrders(prev => [created, ...prev]);
            setSelectedOrder(created);
            setShowProductModal(true);

            const localOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
            localOrders.push(created);
            localStorage.setItem('mockOrders', JSON.stringify(localOrders));
        } catch (error) {
            console.error(error);
            toast.error(t('common.error') || "Error creating order");
        }
    };

    const handleAddProductToOrder = async (product, targetOrder = selectedOrder) => {
        let order = targetOrder;
        
        if (!order) {
            // Auto create takeaway order for direct sales
            try {
                const newOrder = {
                    table_id: null,
                    items: [],
                    total_amount: 0,
                    status: 'pending'
                };
                const { data } = await api.post('/orders', newOrder);
                order = (data && data.length > 0) ? data[0] : { ...newOrder, id: Date.now(), created_at: new Date() };
                setActiveOrders(prev => [order, ...prev]);
                
                const localOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
                localOrders.push(order);
                localStorage.setItem('mockOrders', JSON.stringify(localOrders));
            } catch (error) {
                console.error("Auto order creation failed:", error);
                return;
            }
        }

        if (product.track_stock === true || product.track_stock === 1) {
            if (Number(product.stock_quantity) <= 0) {
                toast.error(t('stock.out_of_stock') || "Out of Stock");
                return;
            }
        }

        const newItems = [...(order.items || [])];
        const existingIdx = newItems.findIndex(i => i.product_id === product.id || i.name === product.name);

        if (existingIdx >= 0) {
            if (product.track_stock === true || product.track_stock === 1) {
                if (newItems[existingIdx].quantity + 1 > Number(product.stock_quantity)) {
                    toast.error(`${t('stock.low_stock') || "Low Stock"}: ${product.stock_quantity} maximum.`);
                    return;
                }
            }
            newItems[existingIdx].quantity += 1;
        } else {
            newItems.push({
                product_id: product.id,
                name: product.name,
                name_ckb: product.name_ckb,
                price: product.price,
                quantity: 1
            });
        }

        const newTotal = calculateOrderTotalWithDiscounts(newItems);

        const updatedOrder = { ...order, items: newItems, total_amount: newTotal };
        setActiveOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
        setSelectedOrder(updatedOrder);
        toast.success(`${product.name} added`);

        try {
            await updateOrder(order.id, { items: newItems, total_amount: newTotal });

            const localOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
            const lIdx = localOrders.findIndex(o => o.id === order.id);
            if (lIdx >= 0) {
                localOrders[lIdx] = updatedOrder;
                localStorage.setItem('mockOrders', JSON.stringify(localOrders));
            }
        } catch (error) {
            console.error("Failed to add item to order:", error);
        }
    };

    const handleBarcodeScan = (val) => {
        setBarcodeSearch(val);
        // Find product by exact barcode or case-insensitive name match
        const match = (allProducts || []).find(p => p.barcode === val.trim() || (p.barcode && p.barcode === val.trim()));
        if (match) {
            handleAddProductToOrder(match);
            setBarcodeSearch(''); // Clear instantly on match
        }
    };

    const [editingItem, setEditingItem] = useState(null); // { orderId, itemIdx, tempNote }

    // ... socket ...

    // ... loadOrders ...

    // ... handleUpdateQty ...

    const startEditItem = (orderId, itemIdx, currentNote) => {
        setEditingItem({ orderId, itemIdx, tempNote: currentNote || '' });
    };

    const cancelEditItem = () => {
        setEditingItem(null);
    };

    const saveEditItem = () => {
        if (!editingItem) return;
        const { orderId, itemIdx, tempNote } = editingItem;

        let localOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
        let orderIdx = localOrders.findIndex(o => o.id === orderId);
        let order;

        if (orderIdx === -1) {
            // Check if it's a static order currently in activeOrders
            const staticOrder = activeOrders.find(o => o.id === orderId);
            if (staticOrder) {
                // Promote to local storage!
                order = { ...staticOrder }; // Clone
                localOrders.push(order);
                orderIdx = localOrders.length - 1;
            } else {
                return; // Not found
            }
        } else {
            order = localOrders[orderIdx];
        }

        const item = order.items[itemIdx];

        // Ensure items array is cloned safely for state immutability
        const newItems = [...order.items];
        newItems[itemIdx] = { ...item, note: tempNote };
        order.items = newItems;

        const newTotal = calculateOrderTotalWithDiscounts(newItems);
        order.total_amount = newTotal;
        order.total = newTotal;

        localOrders[orderIdx] = order; // Update in list
        localStorage.setItem('mockOrders', JSON.stringify(localOrders));

        setActiveOrders(prev => prev.map(o => o.id === orderId ? order : o));
        setSelectedOrder(order);
        setEditingItem(null);

        try {
            updateOrder(orderId, { items: newItems, total_amount: newTotal });
        } catch (error) {
            console.error("Failed to update order note in backend:", error);
        }
    };

    const startCheckout = () => {
        if (!selectedOrder) return;
        setSelectedPaymentMethod('cash');
        setDebtCustomerName('');
        setDebtCustomerPhone('');
        setIsNewDebtCustomer(true);
        setReceivedAmount('');
        setShowPaymentModal(true);
    };

    const handlePay = async (paymentMethod) => {
        if (!selectedOrder) return;

        // Deduct stock if tracking is enabled
        const deductStock = async () => {
            if (!selectedOrder.items) return;
            const updatedProducts = [...allProducts];
            let changed = false;

            for (const item of selectedOrder.items) {
                const prodIndex = updatedProducts.findIndex(p => p.id === item.product_id);
                if (prodIndex >= 0) {
                    const prod = updatedProducts[prodIndex];
                    if (prod.track_stock === true || prod.track_stock === 1) {
                        const newStock = Math.max(0, (prod.stock_quantity || 0) - (item.quantity || 0));
                        updatedProducts[prodIndex] = { ...prod, stock_quantity: newStock };
                        changed = true;
                        api.put(`/products/${prod.id}`, { ...prod, stock_quantity: newStock })
                            .catch(err => console.warn("Failed to update stock in backend:", err));
                        dbData.addOrUpdate({ ...prod, stock_quantity: newStock })
                            .catch(err => console.warn("Failed to update stock in IndexedDB:", err));
                    }
                }
            }
            if (changed) setAllProducts(updatedProducts);
        };

        // Shared cleanup — runs whether API succeeds or fails
        const finalizePay = () => {
            const totalAmount = selectedOrder.total_amount || selectedOrder.total || 0;

            // 1. Remove from active orders
            setActiveOrders(prev => prev.filter(o => o.id !== selectedOrder.id));

            // 2. Update localStorage mockOrders
            const localOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
            localStorage.setItem('mockOrders', JSON.stringify(localOrders.filter(o => o.id !== selectedOrder.id)));

            // 3. Store in mockSales — debt sales ALSO appear in daily sales
            const localSales = JSON.parse(localStorage.getItem('mockSales') || '[]');
            const saleRecord = {
                ...selectedOrder,
                id: selectedOrder.id,
                paid_at: new Date().toISOString(),
                status: 'paid',
                payment_method: paymentMethod,
                total: totalAmount,
                total_amount: totalAmount,
                // Debt customer info (for reference in sales report)
                debt_customer_name: paymentMethod === 'debt' ? (debtCustomerName.trim() || 'مشتەری نەناسراو') : undefined,
                debt_customer_phone: paymentMethod === 'debt' ? (debtCustomerPhone.trim() || '-') : undefined,
                cashier_id: currentUser?.id,
                cashier_name: currentUser?.name
            };
            localStorage.setItem('mockSales', JSON.stringify([saleRecord, ...localSales]));

            // 4. Free the table
            if (selectedOrder.table_id) {
                const storedTablesVal = localStorage.getItem('mockTables');
                if (storedTablesVal) {
                    const storedTables = JSON.parse(storedTablesVal);
                    localStorage.setItem('mockTables', JSON.stringify(
                        storedTables.map(t => t.id === selectedOrder.table_id ? { ...t, status: 'available' } : t)
                    ));
                }
            }

            setSelectedOrder(null);
            setShowPaymentModal(false);

            // Show success with change amount
            if (paymentMethod === 'cash' && receivedAmount) {
                const change = parseFloat(receivedAmount) - (selectedOrder.total_amount || selectedOrder.total || 0);
                if (change > 0) {
                    toast.success(`${t('cashier.payment_confirmed')}\n${t('change_calculator.change') || 'Change'}: ${formatPrice(change)}`, { duration: 6000 });
                } else {
                    toast.success(t('cashier.payment_confirmed'));
                }
            } else if (paymentMethod === 'debt') {
                toast.success(`${t('cashier.payment_confirmed')} — ${t('debts.title') || 'قەرز'} ✓`);
            } else {
                toast.success(t('cashier.payment_confirmed'));
            }
        };

        try {
            await deductStock();

            // Create debt record if payment method is debt
            if (paymentMethod === 'debt') {
                const debtData = {
                    customer_name: debtCustomerName.trim() || 'مشتەری نەناسراو',
                    customer_phone: debtCustomerPhone.trim() || '-',
                    amount: selectedOrder.total_amount || selectedOrder.total || 0,
                    order_id: selectedOrder.id,
                    status: 'unpaid'
                };
                // createDebt now always succeeds (localStorage fallback)
                await api.post('/debts', debtData);
            }

            // Mark order as paid in backend (non-blocking — if fails, finalizePay still runs)
            api.post(`/orders/${selectedOrder.id}/pay`, {
                table_id: selectedOrder.table_id,
                id: currentUser.id,
                name: currentUser.name,
                payment_method: paymentMethod
            }).catch(err => console.warn("Order pay API failed (ok, local fallback active):", err));

            // Print Receipt then finalize
            setTimeout(() => {
                window.print();
                finalizePay();
            }, 100);

        } catch (error) {
            console.error("Pay error:", error);
            // Even on error, finalize locally
            setTimeout(() => {
                window.print();
                finalizePay();
            }, 100);
        }
    };

    if (!currentUser) {
        if (tempLoggedInUser) {
            return (
                <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-[#030712] transition-colors duration-300" dir={i18n.language === 'ckb' ? 'rtl' : 'ltr'}>
                    <div className="glass-panel p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-150 dark:border-slate-800 transition-colors duration-300 animate-fade-in">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
                                <CurrencyDollar size={36} weight="duotone" />
                            </div>
                            <h2 className="text-xl font-black text-gray-800 dark:text-white tracking-wide transition-colors">پارەی دەستپێکی سندوق</h2>
                            <p className="text-xs text-slate-450 mt-1 font-bold">بەکارهێنەر: {tempLoggedInUser.name}</p>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const sc = parseFloat(startingCash) || 0;
                            const fullUser = {
                                ...tempLoggedInUser,
                                startingCash: sc,
                                loginTime: new Date().toISOString()
                            };
                            setCurrentUser(fullUser);
                            sessionStorage.setItem('activeCashier', JSON.stringify(fullUser));
                            setTempLoggedInUser(null);
                            setStartingCash('0');
                        }} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 ml-1">بڕی پارەی سەرەتای سندوق (د.ع)</label>
                                <input
                                    type="number"
                                    value={startingCash}
                                    onChange={e => setStartingCash(e.target.value)}
                                    className="w-full p-4 bg-gray-50 dark:bg-[#11192e] border border-gray-150 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white text-center text-xl font-black outline-none focus:border-emerald-500 transition-all"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all font-bold"
                            >
                                دەستپێکردنی شیفت
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-[#030712] transition-colors duration-300">
                <div className="glass-panel p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-150 dark:border-slate-800 transition-colors duration-300">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-emerald-400 text-white rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                            <User size={36} weight="duotone" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-wide transition-colors">{t('login.title')}</h2>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 ml-1">{t('login.select_user')}</label>
                            <div className="relative">
                                <select
                                    className="w-full p-4 bg-gray-50 dark:bg-[#11192e] border border-gray-150 dark:border-slate-800 rounded-xl text-gray-900 dark:text-gray-200 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 appearance-none transition-all font-semibold"
                                    value={selectedLoginId}
                                    onChange={e => setSelectedLoginId(e.target.value)}
                                >
                                    <option value="" disabled>{t('login.select_user')}...</option>
                                    {(cashiersList || []).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <div className={`absolute ${i18n.language === 'ckb' ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2 ml-1">{t('login.enter_pin')}</label>
                            <input
                                type="password"
                                className={`w-full p-4 bg-gray-50 dark:bg-[#11192e] border rounded-xl text-gray-900 dark:text-white text-center text-2xl tracking-[0.5em] outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder-gray-400 dark:placeholder-gray-600
                                    ${loginError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-150 dark:border-slate-800'}`}
                                value={loginPin}
                                onChange={e => { setLoginPin(e.target.value); setLoginError(false); }}
                                placeholder="••••"
                                maxLength={6}
                                autoFocus
                            />
                            {loginError && <p className="text-red-500 text-sm mt-2 text-center font-semibold animate-pulse">{t('login.invalid')}</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-emerald-500 hover:from-cyan-500 hover:to-emerald-600 text-white font-extrabold text-lg rounded-xl shadow-lg shadow-cyan-500/20 transform active:scale-[0.98] transition-all duration-200 mt-4"
                        >
                            {t('login.login_btn')}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-3 overflow-hidden">
            {/* Header / User Bar */}
            <div className="glass-panel p-2.5 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center px-4 transition-all duration-300">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-tr from-coffee-600 to-coffee-500 text-white rounded-lg flex items-center justify-center font-black shadow-md shadow-coffee-500/20 transform hover:scale-105 transition-transform text-sm">
                        {currentUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-wider leading-none">{t('login.welcome')}</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200 leading-tight mt-0.5 text-xs">{currentUser.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setShowEndShiftModal(true)}
                        className="flex items-center gap-1.5 text-rose-650 hover:text-rose-700 hover:bg-rose-50/10 dark:text-rose-455 dark:hover:bg-rose-955/20 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:scale-102 font-bold text-xs"
                        title="داخستنی شیفت و سندوق"
                    >
                        <Lock size={18} weight="duotone" />
                        <span className="hidden md:inline">داخستنی شیفت (End Shift)</span>
                    </button>
                    <button
                        onClick={() => setShowReportModal(true)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-coffee-600 hover:bg-coffee-50/10 dark:text-gray-400 dark:hover:text-coffee-400 dark:hover:bg-coffee-950/20 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-coffee-150 dark:hover:border-coffee-900/50 hover:scale-102"
                        title={t('sales.reports.title') || "Sales Details"}
                    >
                        <TrendUp size={18} weight="duotone" />
                        <span className="font-bold text-xs hidden md:inline">{t('sales.reports.title') || "Sales Details"}</span>
                    </button>
                    <button
                        onClick={() => setShowCalculator(true)}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-coffee-600 hover:bg-coffee-50/10 dark:text-gray-400 dark:hover:text-coffee-400 dark:hover:bg-coffee-950/20 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-coffee-150 dark:hover:border-coffee-900/50 hover:scale-102"
                        title={t('cashier.calculator.title', 'Calculator')}
                    >
                        <CalculatorIcon size={18} weight="duotone" />
                        <span className="font-bold text-xs hidden md:inline">{t('cashier.calculator.title', 'Calculator')}</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50/10 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-955/20 px-3 py-1.5 rounded-lg transition-all border border-transparent hover:border-red-150 dark:hover:border-red-900/50 hover:scale-102 font-bold text-xs"
                    >
                        <SignOut size={18} weight="duotone" />
                        <span className="hidden sm:inline">{t('login.switch_user')}</span>
                    </button>
                </div>
            </div >

            {/* Keyboard Shortcuts Helper Bar */}
            <div className="flex flex-wrap items-center justify-center gap-2 py-0.5 px-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/60 rounded-lg text-[10px] text-gray-500 dark:text-gray-400">
                <span className="font-semibold">{i18n.language === 'ckb' ? 'رێبەرنامەی خێرا:' : 'Quick Shortcuts:'}</span>
                <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-sm"><kbd className="font-mono font-bold text-coffee-600 dark:text-coffee-400 text-[10px]">F2</kbd> {i18n.language === 'ckb' ? 'ئۆردەری نوێ' : 'New Order'}</span>
                <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-sm"><kbd className="font-mono font-bold text-coffee-600 dark:text-coffee-400 text-[10px]">F4</kbd> {i18n.language === 'ckb' ? 'پارەدان' : 'Checkout'}</span>
                <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-sm"><kbd className="font-mono font-bold text-coffee-600 dark:text-coffee-400 text-[10px]">F1</kbd> {i18n.language === 'ckb' ? 'حاسیبە' : 'Calculator'}</span>
                <span className="flex items-center gap-1 bg-white dark:bg-slate-800 px-1.5 py-0.2 rounded border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 shadow-sm"><kbd className="font-mono font-bold text-coffee-600 dark:text-coffee-400 text-[10px]">ESC</kbd> {i18n.language === 'ckb' ? 'داخستن' : 'Close Modal'}</span>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 gap-6 overflow-hidden">
                {/* Left/Center Column - Carts slider, search, categories, and products shelf grid */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Top horizontal carts slider */}
                    <div className="glass-panel p-2 rounded-xl flex items-center gap-2 overflow-x-auto no-scrollbar border border-slate-200/60 dark:border-slate-800/60 shadow-sm shrink-0">
                        <div className="flex-shrink-0 font-bold text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                            {i18n.language === 'ckb' ? 'عەرەبانەکان:' : 'Carts:'}
                        </div>
                        <div className="flex items-center gap-2 flex-grow overflow-x-auto no-scrollbar py-0.5" dir={i18n.language === 'ckb' ? 'rtl' : 'ltr'}>
                            {activeOrders.map(order => {
                                const isActive = selectedOrder?.id === order.id;
                                const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                                const summary = getOrderSummary(order);
                                return (
                                    <div
                                        key={order.id}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none whitespace-nowrap shrink-0 group relative hover-lift
                                            ${isActive 
                                                ? 'bg-coffee-500 text-white border-coffee-500 shadow-md shadow-coffee-500/20' 
                                                : 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-855 text-slate-700 dark:text-slate-200 hover:border-coffee-500/60'
                                            }`}
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        <ShoppingCart size={14} weight={isActive ? "fill" : "regular"} className={isActive ? "text-white" : "text-coffee-500"} />
                                        <div className="text-[11px] font-extrabold flex items-center gap-1">
                                            <span>{t('cashier.table')}</span>
                                            <span dir="ltr">#{String(order.id).slice(-4)}</span>
                                            {itemCount > 0 && (
                                                <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${isActive ? 'bg-white text-coffee-600' : 'bg-coffee-100 text-coffee-700 dark:bg-coffee-950/40 dark:text-coffee-400'}`}>
                                                    {itemCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className={`text-[9.5px] ${isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'} font-bold`}>
                                            {formatPrice(summary.total)}
                                        </div>
                                        
                                        {/* Void Button on hover or active */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedOrder(order);
                                                setShowVoidModal(true);
                                            }}
                                            className={`p-0.5 rounded transition-all
                                                ${isActive 
                                                    ? 'text-white/60 hover:text-white hover:bg-white/10' 
                                                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'
                                                }`}
                                            title={t('cashier.void_order')}
                                        >
                                            <Trash size={11} weight="bold" />
                                        </button>
                                    </div>
                                );
                            })}
                            
                            {/* Add Cart Button */}
                            <button
                                onClick={handleNewTakeaway}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-coffee-400 hover:border-coffee-500 bg-coffee-50/10 dark:bg-coffee-950/5 text-coffee-600 dark:text-coffee-400 hover:bg-coffee-50/20 transition-all font-bold text-[11px] shrink-0 hover-lift"
                            >
                                <Plus size={14} weight="bold" />
                                <span>{i18n.language === 'ckb' ? 'نوێ' : 'New'}</span>
                            </button>
                        </div>
                    </div>
 
                    {/* Barcode scanner, search, and category slider */}
                    <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0">
                        {/* Search & Barcode Input */}
                        <div className="relative w-full sm:w-80">
                            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
                                <MagnifyingGlass size={18} />
                            </span>
                            <Input
                                placeholder={i18n.language === 'ckb' ? 'سکانکردنی بارکۆدی بەرهەم...' : 'Scan product barcode...'}
                                value={barcodeSearch}
                                onChange={(e) => handleBarcodeScan(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-full border-2 border-coffee-500/80 focus:border-coffee-500 bg-white dark:bg-slate-900/60 rounded-xl outline-none transition-all text-sm font-semibold shadow-sm"
                                autoComplete="off"
                                autoFocus
                            />
                        </div>
 
                        {/* Local Search Input for extra filters */}
                        <div className="relative w-full sm:flex-1">
                            <Input
                                placeholder={i18n.language === 'ckb' ? 'گەڕان بەپێی ناوی بەرهەم...' : 'Search product name...'}
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full text-sm py-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800"
                            />
                        </div>
                    </div>

                    {/* Categories Horizontal Menu */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-200/50 dark:border-slate-800/60 pb-2 shrink-0">
                        {['All', ...new Set((allProducts || []).map(p => p.category).filter(Boolean))].map(cat => {
                            const isCatActive = selectedCategory === cat;
                            const count = cat === 'All' 
                                ? allProducts.length 
                                : allProducts.filter(p => p.category === cat).length;
                            const emoji = getCategoryEmoji(cat);
                            const translatedCatName = t(`categories.${cat}`) || cat;

                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all font-bold text-xs whitespace-nowrap hover-lift
                                        ${isCatActive 
                                            ? 'bg-coffee-500 text-white border-coffee-500 shadow-sm shadow-coffee-500/10' 
                                            : 'bg-white dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800/60 text-slate-600 dark:text-slate-350 hover:border-coffee-200'
                                        }`}
                                >
                                    <span>{emoji}</span>
                                    <span>{translatedCatName}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isCatActive ? 'bg-white text-coffee-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Products shelf inline grid */}
                    <div className="flex-1 overflow-y-auto pr-1">
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-1 pb-6">
                            {(allProducts || [])
                                .filter(product => {
                                    // 1. Category Filter
                                    if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;
                                    // 2. Search Text / Barcode Filter
                                    if (!productSearch) return true;
                                    const q = productSearch.toLowerCase();
                                    return product.name.toLowerCase().includes(q) ||
                                        (product.name_ckb && product.name_ckb.toLowerCase().includes(q)) ||
                                        (product.barcode && product.barcode.includes(q)) ||
                                        product.category.toLowerCase().includes(q);
                                })
                                .map(product => {
                                    const hasStockTracking = product.track_stock === true || product.track_stock === 1;
                                    const isOutOfStock = hasStockTracking && Number(product.stock_quantity) <= 0;
                                    const isLowStock = hasStockTracking && Number(product.stock_quantity) < 5 && Number(product.stock_quantity) > 0;
                                    const displayName = i18n.language === 'ckb' ? (product.name_ckb || product.name) : product.name;

                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => !isOutOfStock && handleAddProductToOrder(product)}
                                            className={`p-3.5 rounded-2xl border bg-white dark:bg-[#0f172a]/30 border-slate-200/60 dark:border-slate-800/60 hover:border-coffee-500 dark:hover:border-coffee-500/80 hover:bg-white dark:hover:bg-[#0f172a]/55 hover:shadow-xl hover:shadow-coffee-500/5 group text-center relative hover-lift select-none cursor-pointer flex flex-col justify-between min-h-[310px] pb-4
                                                ${isOutOfStock ? 'opacity-50 cursor-not-allowed border-red-200 dark:border-red-955/30' : ''}`}
                                        >
                                            {/* Stock Badge */}
                                            {hasStockTracking && (
                                                <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full z-10 shadow-sm
                                                    ${isOutOfStock
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-955/40 dark:text-red-400'
                                                        : isLowStock
                                                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-955/40 dark:text-orange-400'
                                                            : 'bg-coffee-100 text-coffee-700 dark:bg-coffee-955/40 dark:text-coffee-400'
                                                    }`}>
                                                    {isOutOfStock 
                                                        ? (t('stock.out_of_stock') || "Out") 
                                                        : `${t('stock.in_stock') || "Stock"}: ${product.stock_quantity}`}
                                                </span>
                                            )}

                                            {/* Product Image or Placeholder */}
                                            <div className="h-44 w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden flex items-center justify-center shrink-0 mb-3">
                                                {product.image_url ? (
                                                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                ) : (
                                                    <div className="text-coffee-400/70 font-black text-3xl uppercase tracking-wider">
                                                        {displayName.slice(0, 2)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Product Info */}
                                            <div className="flex flex-col flex-1 justify-between">
                                                <h3 className="font-extrabold text-base text-gray-850 dark:text-gray-150 line-clamp-2 leading-tight">
                                                    {displayName}
                                                </h3>
                                                <div className="font-black text-base text-coffee-600 dark:text-coffee-400 mt-2.5">
                                                    {formatPrice(product.price)}
                                                </div>
                                            </div>

                                            {product.cashier_only && (
                                                <span className="absolute bottom-2 left-2 text-[8px] bg-red-100 text-red-650 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider scale-90">
                                                    {t('products.cashier_only') || "Cashier"}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </div>

                {/* Right Column - Checkout panel (Order Details & Checkout) */}
                <div className="w-full lg:w-[380px] glass-panel rounded-3xl border border-slate-200/60 dark:border-slate-800/80 flex flex-col transition-all overflow-hidden shrink-0 shadow-lg">
                    {selectedOrder ? (
                        <>
                            {/* Current Cart Header */}
                            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-200/50 dark:border-slate-800/85 flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="font-extrabold text-base text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
                                        <ShoppingCart className="text-coffee-500" size={18} />
                                        {t('cashier.table')} #{String(selectedOrder.id).slice(-4)}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                                        {formatDate(selectedOrder.created_at, i18n.language, t)} | {formatTime(selectedOrder.created_at, i18n.language)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('cashier.total')}</span>
                                    <span className="block font-black text-xl text-coffee-600 dark:text-coffee-400 leading-none mt-0.5">
                                        {formatPrice(getOrderSummary(selectedOrder).total)}
                                    </span>
                                </div>
                            </div>

                            {/* Items List in Cart */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {(!selectedOrder.items || selectedOrder.items.length === 0) ? (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 py-12">
                                        <ShoppingCart size={48} weight="thin" className="mb-2 text-gray-300 dark:text-gray-600" />
                                        <p className="text-xs font-bold uppercase tracking-wider">{t('captain.cart_empty') || "Cart is empty"}</p>
                                    </div>
                                ) : (
                                    selectedOrder.items.map((item, idx) => {
                                        const isEditing = editingItem && editingItem.orderId === selectedOrder.id && editingItem.itemIdx === idx;
                                        const pRef = allProducts.find(p => p.id === item.product_id) || {};
                                        const displayName = i18n.language === 'ckb' ? (item.name_ckb || pRef.name_ckb || item.name) : (item.name || pRef.name);

                                        return (
                                            <div key={idx} className="p-3 bg-white/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl flex flex-col gap-2 relative">
                                                {/* Header Line: Name & Price */}
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex items-start gap-2">
                                                        <div className="bg-coffee-100 text-coffee-700 dark:bg-coffee-950/40 dark:text-coffee-400 px-2 py-0.5 rounded-lg text-xs font-black shrink-0">
                                                            {item.quantity}X
                                                        </div>
                                                        <div className="font-extrabold text-xs text-gray-800 dark:text-gray-100 leading-tight">
                                                            {displayName}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <div className="font-black text-xs text-slate-800 dark:text-slate-200">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                                            {formatPrice(item.price)} / {getUnitText(pRef.description, 1, t)}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Note or Modifier tag */}
                                                {item.note && !isEditing && (
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-pink-100 dark:bg-pink-950/30 text-pink-700 dark:text-pink-400 border border-pink-200/30">
                                                            {item.note}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Editing Modifier Panel */}
                                                {isEditing ? (
                                                    <div className="flex flex-col gap-2 mt-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
                                                        <div className="flex flex-wrap gap-1">
                                                            {['Extra Shot', 'No Sugar', 'Less Ice', 'Takeaway'].map(mod => {
                                                                const tKey = mod.toLowerCase().replace(' ', '_');
                                                                const label = t(`modifiers.${tKey}`) || mod;
                                                                const isSelected = editingItem.tempNote?.includes(label);
                                                                return (
                                                                    <button
                                                                        key={mod}
                                                                        onClick={() => {
                                                                            const current = editingItem.tempNote || '';
                                                                            const newNote = isSelected
                                                                                ? current.replace(label, '').replace(', ,', ',').trim()
                                                                                : (current ? `${current}, ${label}` : label);
                                                                            setEditingItem(prev => ({ ...prev, tempNote: newNote }));
                                                                        }}
                                                                        className={`px-2 py-0.5 text-[9px] font-bold rounded-full border transition-all
                                                                            ${isSelected
                                                                                ? 'bg-coffee-500 text-white border-coffee-500'
                                                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:bg-slate-50'
                                                                            }`}
                                                                    >
                                                                        {label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div className="flex gap-1.5 mt-1">
                                                            <input
                                                                type="text"
                                                                className="border border-slate-200 rounded-lg p-1.5 text-xs flex-1 focus:outline-none focus:border-coffee-500 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                                                placeholder={t('cashier.add_note')}
                                                                autoFocus
                                                                autoComplete="off"
                                                                onFocus={(e) => openKeyboard?.(e.target, 'default', editingItem.tempNote, (evt) => {
                                                                    setEditingItem(prev => ({ ...prev, tempNote: evt.target.value }));
                                                                })}
                                                                value={editingItem.tempNote}
                                                                onChange={(e) => setEditingItem(prev => ({ ...prev, tempNote: e.target.value }))}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveEditItem();
                                                                    if (e.key === 'Escape') cancelEditItem();
                                                                }}
                                                            />
                                                            <button onClick={saveEditItem} className="text-[10px] bg-coffee-500 text-white px-2.5 py-1 rounded-lg font-black transition-all hover:bg-coffee-600">{t('common.save')}</button>
                                                            <button onClick={cancelEditItem} className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-bold border border-slate-200/50 dark:bg-slate-800 dark:text-slate-350 dark:border-slate-700 hover:bg-slate-200">{t('common.cancel')}</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    /* Item Actions Line: Increment, Decrement, Edit Note */
                                                    <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-150/40 dark:border-slate-800/40">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleUpdateQty(selectedOrder.id, idx, -1)}
                                                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors font-black text-sm"
                                                            >-</button>
                                                            <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => handleUpdateQty(selectedOrder.id, idx, 1)}
                                                                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors font-black text-sm"
                                                            >+</button>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => startEditItem(selectedOrder.id, idx, item.note)}
                                                                className="p-1 text-coffee-600 hover:bg-coffee-50 dark:hover:bg-coffee-950/20 rounded-lg transition-all"
                                                                title={t('captain.edit_note')}
                                                            >
                                                                <Pencil size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleUpdateQty(selectedOrder.id, idx, -item.quantity)}
                                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg transition-all"
                                                                title={t('common.delete')}
                                                            >
                                                                <Trash size={15} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Bill Summary Breakdown */}
                            <div className="p-4 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/50 dark:border-slate-800/80 flex flex-col gap-2 shrink-0">
                                {(() => {
                                    const summary = getOrderSummary(selectedOrder);
                                    return (
                                        <>
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400">
                                                <span>Subtotal</span>
                                                <span>{formatPrice(summary.subtotal)}</span>
                                            </div>
                                            {summary.discount > 0 && (
                                                <div className="flex justify-between items-center text-xs font-extrabold text-red-500 dark:text-red-400">
                                                    <span>Discount</span>
                                                    <span>-{formatPrice(summary.discount)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                                                <span>Tax (0%)</span>
                                                <span>0 {t('common.currency')}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-1.5">
                                                <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">{t('cashier.total')}</span>
                                                <span className="font-black text-xl text-coffee-600 dark:text-coffee-400">{formatPrice(summary.total)}</span>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2.5 mt-2">
                                                <Button
                                                    variant="danger"
                                                    onClick={() => setShowVoidModal(true)}
                                                    className="px-3.5 py-3 bg-red-50 text-red-600 hover:bg-red-100/85 border border-red-200/60 dark:bg-red-950/15 dark:text-red-400 dark:border-red-900/40 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all hover-lift"
                                                >
                                                    <Trash size={16} weight="bold" />
                                                    <span>{t('cashier.void_order') || "Void"}</span>
                                                </Button>
                                                <Button
                                                    onClick={startCheckout}
                                                    disabled={!selectedOrder.items || selectedOrder.items.length === 0}
                                                    className="flex-1 py-3 text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-coffee-500/20 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-500 hover:to-coffee-600 text-white rounded-xl transition-all hover-lift disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle size={18} weight="bold" />
                                                    <span>{t('cashier.mark_paid')}</span>
                                                </Button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </>
                    ) : (
                        /* Empty Checkout Panel */
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none">
                            <div className="max-w-[280px] w-full p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-900/35 border border-dashed border-slate-200 dark:border-slate-800/80 flex flex-col items-center justify-center transition-all hover:border-coffee-500/50 group">
                                <div className="w-16 h-16 rounded-2xl bg-coffee-50 dark:bg-coffee-950/20 text-coffee-500 dark:text-coffee-400 flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform">
                                    <ShoppingCart size={32} weight="duotone" />
                                </div>
                                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-1">
                                    {i18n.language === 'ckb' ? 'هیچ عەرەبانەک دیاری نەکراوە' : 'No Active Cart'}
                                </h3>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 leading-relaxed">
                                    {i18n.language === 'ckb' 
                                        ? 'عەرەبانەیەکی چالاک لە لیستی سەرەوە هەڵبژێرە، یان عەرەبانەیەکی نوێ دروست بکە بۆ زیادکردنی بەرهەمەکان.' 
                                        : 'Select an active cart from the list above, or create a new one to start adding products.'}
                                </p>
                                <Button
                                    onClick={handleNewTakeaway}
                                    className="w-full bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-500 hover:to-coffee-600 text-white font-black text-sm py-3 px-6 rounded-xl shadow-lg shadow-coffee-500/10 transition-all hover-lift flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} weight="bold" />
                                    <span>{i18n.language === 'ckb' ? 'دروستکردنی عەرەبانە' : 'Create Cart'}</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            {/* Printable Receipt (Hidden on screen, visible on print) */}
                {selectedOrder && (
                    <div id="receipt" className="hidden print:block text-black font-mono" dir={i18n.language === 'ckb' ? 'rtl' : 'ltr'}>
                        <div className="text-center">
                            <h1 className="text-3xl font-bold mb-1">{storeName}</h1>
                            {storeAddress && <p className="text-sm mb-1">{storeAddress}</p>}
                            {storePhone && <p className="text-sm mb-2">{t('debts.phone') || 'Phone'}: {storePhone}</p>}
                            <p className="text-xs text-gray-600 border-b border-gray-200 pb-2 mb-4">{t('receipt.subtitle', 'Market Checkout')}</p>
 
                            <div className="text-start border-b-2 border-dashed border-gray-300 pb-4 mb-4">
                                <p><strong>{t('cashier.order')} #:</strong> {String(selectedOrder.id).slice(-4)}</p>
                                <p><strong>{t('receipt.date', 'Date')}:</strong> {formatDate(new Date(), i18n.language, t)} {formatTime(new Date(), i18n.language)}</p>
                                <p><strong>{selectedOrder.table_id ? `${t('cashier.table')} ${selectedOrder.table_id}` : t('cashier.takeaway')}</strong></p>
                                <p><strong>{t('receipt.cashier', 'Cashier')}:</strong> {currentUser.name}</p>
                                <p><strong>{t('cashier.payment_method') || 'Payment Method'}:</strong> {t(`payment_methods.${selectedPaymentMethod}`) || selectedPaymentMethod.toUpperCase()}</p>
                                {selectedPaymentMethod === 'debt' && (
                                    <>
                                        <p><strong>{t('debts.customer')}:</strong> {debtCustomerName}</p>
                                        <p><strong>{t('debts.phone')}:</strong> {debtCustomerPhone}</p>
                                    </>
                                )}
                            </div>
 
                            <table className="w-full text-start text-sm mb-4">
                                <thead>
                                    <tr className="border-b border-gray-300">
                                        <th className="pb-1 text-start">{t('cashier.qty')}</th>
                                        <th className="pb-1 text-start">{t('cashier.item')}</th>
                                        <th className="text-end pb-1">{t('cashier.price')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(selectedOrder.items || []).map((item, idx) => {
                                        const pRef = allProducts.find(p => p.id === item.product_id) || {};
                                        const itemNameEn = item.name || pRef.name || `${t('cashier.item')} #${item.product_id}`;
                                        const itemNameCkb = item.name_ckb || pRef.name_ckb || itemNameEn;
                                        const displayName = i18n.language === 'ckb' ? itemNameCkb : itemNameEn;
 
                                        return (
                                            <tr key={idx} className="border-b border-dashed border-gray-200">
                                                <td className="py-2 px-1 valign-top">
                                                    {item.quantity} {getUnitText(pRef.description, item.quantity, t)}
                                                </td>
                                                <td className="py-2 valign-top">
                                                    <div>{displayName}</div>
                                                    {item.note && <div className="text-xs italic text-gray-500">({item.note})</div>}
                                                </td>
                                                <td className="py-2 text-end valign-top">{formatPrice(item.price * item.quantity)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
 
                            <div className="border-t-2 border-dashed border-gray-300 pt-4 mb-8">
                                <div className="flex justify-between text-xl font-bold">
                                    <span>{t('cashier.total')}</span>
                                    <span>{formatPrice(selectedOrder.total_amount || selectedOrder.total || 0)}</span>
                                </div>
                            </div>
 
                            <div className="text-center text-sm text-gray-500">
                                <p>{t('receipt.thank_you', 'Thank you for visiting!')}</p>
                                <p>{t('receipt.visit_again', 'Please come again.')}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showCalculator && <Calculator onClose={() => setShowCalculator(false)} />}
            {showReportModal && <CashierReportModal onClose={() => setShowReportModal(false)} currentUser={currentUser} />}
            {showEndShiftModal && (
                <EndShiftModal 
                    onClose={() => setShowEndShiftModal(false)} 
                    onConfirm={() => {
                        setShowEndShiftModal(false);
                        handleLogout();
                    }} 
                    currentUser={currentUser} 
                />
            )}
            <VoidReasonModal
                isOpen={showVoidModal}
                onClose={() => setShowVoidModal(false)}
                onConfirm={(reason) => {
                    // Handle Void
                    setActiveOrders(prev => prev.filter(o => o.id !== selectedOrder?.id));

                    // Update Local Storage
                    const localOrders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
                    const updatedLocal = localOrders.filter(o => o.id !== selectedOrder?.id);
                    localStorage.setItem('mockOrders', JSON.stringify(updatedLocal));

                    // Save to "Voided" list (simulating backend)
                    if (selectedOrder) {
                        const voidedRecord = { ...selectedOrder, status: 'voided', reason, voided_at: new Date() };
                        const existingVoids = JSON.parse(localStorage.getItem('mockVoids') || '[]');
                        localStorage.setItem('mockVoids', JSON.stringify([voidedRecord, ...existingVoids]));

                        // Free Table
                        if (selectedOrder.table_id) {
                            const storedTables = JSON.parse(localStorage.getItem('mockTables') || '[]');
                            const updatedTables = storedTables.map(t =>
                                t.id === selectedOrder.table_id ? { ...t, status: 'available' } : t
                            );
                            localStorage.setItem('mockTables', JSON.stringify(updatedTables));
                        }
                    }

                    setSelectedOrder(null);
                    setShowVoidModal(false);
                    toast.success(t('cashier.order_voided') || "Order voided successfully");
                }}
            />
            {showPaymentModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={() => setShowPaymentModal(false)}>
                    <div className="glass-panel rounded-2xl shadow-xl w-full max-w-3xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                            <h2 className="text-xl font-bold dark:text-gray-100">{t('cashier.payment_method') || "Payment Method"}</h2>
                            <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                <X size={24} weight="bold" />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
                            <div className="flex flex-row gap-4 sm:gap-6">
                                {/* Left Column: Payment Options List */}
                                <div className="w-[130px] sm:w-[180px] flex-shrink-0 flex flex-col gap-2">
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        {t('cashier.select_payment_method') || "ڕێگای پارەدان"}
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {[
                                            { id: 'cash', label: t('payment_methods.cash') || 'Cash (نەختینە)' },
                                            { id: 'fastpay', label: 'FastPay' },
                                            { id: 'fib', label: 'FIB' },
                                            { id: 'zaincash', label: 'ZainCash' },
                                            { id: 'card', label: t('payment_methods.card') || 'Card (Visa/Master)' },
                                            { id: 'debt', label: t('payment_methods.debt') || 'Debt (قەرز)' }
                                        ].map(method => {
                                            const isActive = selectedPaymentMethod === method.id;
                                            return (
                                                <button
                                                    key={method.id}
                                                    type="button"
                                                    onClick={() => setSelectedPaymentMethod(method.id)}
                                                    className={`p-3 border rounded-xl font-bold transition-all text-center flex flex-col items-center justify-center gap-0.5 hover-lift text-xs sm:text-sm min-h-[52px]
                                                        ${isActive 
                                                            ? 'ring-2 ring-coffee-500 bg-gradient-to-r from-coffee-600 to-coffee-500 text-white border-transparent shadow-lg shadow-coffee-500/20 aurora-glow' 
                                                            : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/60 text-gray-700 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-900/40'}
                                                    `}
                                                >
                                                    <span>{method.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Vertical Divider */}
                                <div className="w-px bg-slate-200/60 dark:bg-slate-800/60 self-stretch" />

                                {/* Right Column: Details & Calculator */}
                                <div className="flex-1 flex flex-col justify-between space-y-4">
                                    <div className="flex-1 space-y-4">
                                        {/* Debt customer fields */}
                                        {selectedPaymentMethod === 'debt' && (
                                            <div className="p-4 bg-slate-50/30 dark:bg-slate-900/10 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 animate-fade-in">
                                                <div className="flex gap-4 border-b border-slate-200/40 dark:border-slate-800/40 pb-2 mb-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsNewDebtCustomer(true)}
                                                        className={`text-sm font-bold pb-1 border-b-2 transition-all ${isNewDebtCustomer ? 'border-coffee-500 text-coffee-600 dark:text-coffee-400' : 'border-transparent text-gray-500'}`}
                                                    >
                                                        {t('debts.register_new') || "New Customer"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsNewDebtCustomer(false)}
                                                        className={`text-sm font-bold pb-1 border-b-2 transition-all ${!isNewDebtCustomer ? 'border-coffee-500 text-coffee-600 dark:text-coffee-400' : 'border-transparent text-gray-500'}`}
                                                    >
                                                        {t('debts.select_customer') || "Existing Customer"}
                                                    </button>
                                                </div>

                                                {isNewDebtCustomer ? (
                                                    <div className="space-y-3">
                                                        <Input
                                                            label={t('debts.customer_name') || "Customer Name"}
                                                            value={debtCustomerName}
                                                            onChange={e => setDebtCustomerName(e.target.value)}
                                                            placeholder="e.g. Dana Ahmad"
                                                            required
                                                        />
                                                        <Input
                                                            label={t('debts.customer_phone') || "Customer Phone"}
                                                            value={debtCustomerPhone}
                                                            onChange={e => setDebtCustomerPhone(e.target.value)}
                                                            placeholder="e.g. 07701234567"
                                                            required
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                                                            {t('debts.select_customer') || "Select Customer"}
                                                        </label>
                                                        {existingDebtors.length === 0 ? (
                                                            <p className="text-sm text-gray-400 italic">No registered customers found. Please use "New Customer" option.</p>
                                                        ) : (
                                                            <select
                                                                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-gray-200 outline-none focus:border-coffee-500 focus:ring-1 focus:ring-coffee-500"
                                                                onChange={e => {
                                                                    const debtor = existingDebtors[e.target.value];
                                                                    if (debtor) {
                                                                        setDebtCustomerName(debtor.name);
                                                                        setDebtCustomerPhone(debtor.phone);
                                                                    }
                                                                }}
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>{t('debts.select_customer')}...</option>
                                                                {existingDebtors.map((debtor, idx) => (
                                                                    <option key={idx} value={idx}>
                                                                        {debtor.name} ({debtor.phone})
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Cash Change Calculator */}
                                        {selectedPaymentMethod === 'cash' && (
                                            <div className="p-4 bg-slate-50/40 dark:bg-slate-900/20 rounded-xl border border-slate-200/50 dark:border-slate-800/50 space-y-4 animate-fade-in">
                                                <div className="flex justify-between items-center text-sm font-semibold text-coffee-600 dark:text-coffee-400">
                                                    <span>{t('change_calculator.quick_cash') || "Quick Cash"}</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {[
                                                        (selectedOrder.total_amount || selectedOrder.total || 0),
                                                        5000,
                                                        10000,
                                                        25000,
                                                        50000
                                                    ].map((cashVal, idx) => {
                                                        if (cashVal < (selectedOrder.total_amount || selectedOrder.total || 0) && idx > 0) return null; // Hide if less than total
                                                        return (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() => setReceivedAmount(String(cashVal))}
                                                                className="px-3 py-2 text-xs font-bold rounded-lg border border-coffee-200 bg-white hover:bg-coffee-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700/50 text-coffee-700 dark:text-coffee-400 transition-colors hover-lift"
                                                            >
                                                                {idx === 0 ? (t('change_calculator.exact') || "Exact") : formatPrice(cashVal)}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                <Input
                                                    label={t('change_calculator.received') || "Received Amount"}
                                                    type="number"
                                                    value={receivedAmount}
                                                    onChange={e => setReceivedAmount(e.target.value)}
                                                    placeholder="e.g. 50000"
                                                    required
                                                />

                                                {receivedAmount && parseFloat(receivedAmount) >= (selectedOrder.total_amount || selectedOrder.total || 0) && (() => {
                                                    const change = parseFloat(receivedAmount) - (selectedOrder.total_amount || selectedOrder.total || 0);
                                                    const notes = getChangeNotes(change);
                                                    return (
                                                        <div className="space-y-3">
                                                            <div className="p-2 bg-gradient-to-r from-coffee-600 to-coffee-500 text-white rounded-xl text-center animate-fade-in shadow-md shadow-coffee-500/15">
                                                                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-95">{t('change_calculator.change') || "Change to Return"}</span>
                                                                <span className="text-xl font-extrabold">{formatPrice(change)}</span>
                                                            </div>
                                                            {notes.length > 0 && (
                                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 rounded-xl space-y-2 animate-fade-in">
                                                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block text-left rtl:text-right">
                                                                        پێکهاتەی پارەکە (Banknote Breakdown):
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-3 justify-center">
                                                                        {notes.map((note, nIdx) => (
                                                                            <div key={nIdx} className="flex flex-col items-center gap-2 p-2 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-150 dark:border-slate-850 shadow-md relative group hover:scale-102 transition-transform w-[240px]">
                                                                                <div className="h-28 w-56 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-800/60 bg-slate-100 flex items-center justify-center">
                                                                                    <img src={note.img} alt={`${note.value} IQD`} className="h-full w-full object-cover" />
                                                                                </div>
                                                                                <span className="text-xs sm:text-sm font-extrabold text-gray-800 dark:text-gray-200">
                                                                                    {note.label} {t('common.currency')} × {note.count}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}

                                                {receivedAmount && parseFloat(receivedAmount) < (selectedOrder.total_amount || selectedOrder.total || 0) && (
                                                    <div className="p-3 bg-red-500/90 text-white rounded-xl text-center text-xs font-bold animate-fade-in">
                                                        {t('change_calculator.not_enough') || "Received amount is not enough"}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Digital / Card Payment Info Fallback */}
                                        {!['cash', 'debt'].includes(selectedPaymentMethod) && (
                                            <div className="p-6 bg-slate-50/30 dark:bg-slate-900/10 rounded-xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col items-center justify-center text-center space-y-3 min-h-[160px] animate-fade-in">
                                                <div className="w-12 h-12 rounded-full bg-coffee-500/10 dark:bg-coffee-500/20 flex items-center justify-center text-coffee-500">
                                                    <CreditCard size={24} weight="bold" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-gray-200">
                                                        {t(`payment_methods.${selectedPaymentMethod}`) || selectedPaymentMethod.toUpperCase()}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[240px]">
                                                        {t('cashier.digital_payment_helper') || "دڵنیابەوە لەوەی کڕیارەکە بڕی پارەکەی لە ڕێگەی ئەم دراوە ئەلیکترۆنییەوە ناردووە پێش پشتڕاستکردنەوە."}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary info */}
                                    <div className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/80 rounded-xl animate-fade-in">
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">{t('cashier.total_amount')}</span>
                                        <span className="text-2xl font-bold text-coffee-600 dark:text-coffee-400">
                                            {formatPrice(selectedOrder.total_amount || selectedOrder.total || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200/50 dark:border-slate-800/80 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1"
                            >
                                {t('common.cancel')}
                            </Button>
                            <Button
                                onClick={() => {
                                    if (selectedPaymentMethod === 'debt' && !debtCustomerName.trim()) {
                                        toast.error("Please enter a customer name for debt payment.");
                                        return;
                                    }
                                    handlePay(selectedPaymentMethod);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-coffee-600 to-coffee-500 hover:from-coffee-500 hover:to-coffee-600 text-white font-bold shadow-lg shadow-coffee-500/15 hover-lift aurora-glow"
                            >
                                <CheckCircle size={20} />
                                {t('common.confirm') || "Confirm"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {showProductModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 animate-fade-in" onClick={() => setShowProductModal(false)}>
                    <div className="glass-panel rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-slate-200/50 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
                            <h2 className="text-xl font-bold dark:text-gray-100">{t('common.add') || "Add Item"} - #{String(selectedOrder?.id).slice(-4)}</h2>
                            <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                                <X size={24} weight="bold" />
                            </button>
                        </div>
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-900/25 border-b border-slate-200/50 dark:border-slate-800/80">
                            <Input
                                placeholder="Search products by name or barcode... (گەڕان بەپێی ناو یان بارکۆد)"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {(allProducts || [])
                                .filter(product => {
                                    if (!productSearch) return true;
                                    const q = productSearch.toLowerCase();
                                    return product.name.toLowerCase().includes(q) ||
                                        (product.name_ckb && product.name_ckb.toLowerCase().includes(q)) ||
                                        (product.barcode && product.barcode.includes(q)) ||
                                        product.category.toLowerCase().includes(q);
                                })
                                .map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => handleAddProductToOrder(product)}
                                    disabled={(product.track_stock === true || product.track_stock === 1) && Number(product.stock_quantity) <= 0}
                                    className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all bg-white/50 dark:bg-[#0f172a]/30 border-slate-200/60 dark:border-slate-800/60 hover:border-coffee-500 dark:hover:border-coffee-500/80 hover:bg-white dark:hover:bg-[#0f172a]/55 hover:shadow-lg hover:shadow-coffee-500/5 group text-center relative hover-lift
                                        ${(product.track_stock === true || product.track_stock === 1) && Number(product.stock_quantity) <= 0 ? 'opacity-50 cursor-not-allowed border-red-200 dark:border-red-950/30' : ''}
                                    `}
                                >
                                    {/* Stock Badge */}
                                    {(product.track_stock === true || product.track_stock === 1) && (
                                        <span className={`absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full z-10
                                            ${Number(product.stock_quantity) <= 0
                                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                                                : Number(product.stock_quantity) < 5
                                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
                                                    : 'bg-coffee-100 text-coffee-700 dark:bg-coffee-950/40 dark:text-coffee-400'
                                            }
                                        `}>
                                            {Number(product.stock_quantity) <= 0 ? (t('stock.out_of_stock') || "Out") : `${t('stock.in_stock') || "Stock"}: ${product.stock_quantity} ${getUnitText(product.description, product.stock_quantity, t)}`}
                                        </span>
                                    )}

                                    <div className="h-20 w-20 bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-lg overflow-hidden shrink-0">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400"><Plus size={32} /></div>
                                        )}
                                    </div>
                                    <span className="font-bold text-sm dark:text-gray-200 line-clamp-2">
                                        {i18n.language === 'ckb' ? (product.name_ckb || product.name) : product.name}
                                    </span>
                                    {product.cashier_only && (
                                        <span className="text-[10px] bg-red-100 text-red-650 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                            {t('products.cashier_only') || "Cashier Only"}
                                        </span>
                                    )}
                                    <span className="text-coffee-600 font-bold dark:text-coffee-400">{formatPrice(product.price)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
};

export default CashierPage;
