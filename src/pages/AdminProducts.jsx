import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { fetchProducts, api } from '../api';
import Button from '../components/Button';
import Input from '../components/Input';
import { Trash, Plus, Pencil, Image, UploadSimple, Package, ArrowCounterClockwise } from '@phosphor-icons/react';
import AdminGuard from '../components/AdminGuard';
import { dbData } from '../db'; // Import IndexedDB wrapper

export const getUnitText = (desc, count, t) => {
    const unitKey = desc && ['piece', 'carton', 'kilo', 'pack'].includes(desc.toLowerCase())
        ? desc.toLowerCase()
        : 'piece';
    return t(`units.${unitKey}`) || unitKey;
};

const AdminProducts = () => {
    const { t, i18n } = useTranslation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ name: '', name_ckb: '', category: '', price: '', barcode: '', image_url: '', sub_category: '', cashier_only: false, track_stock: false, stock_quantity: '', description: 'piece', expiry_date: '' });
    const [editingId, setEditingId] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Refs for autofocus during scanning workflow
    const barcodeInputRef = React.useRef(null);
    const qtyInputRef = React.useRef(null);
    const nameInputRef = React.useRef(null);

    // Quick Barcode Stock Manager State
    const [showScanManager, setShowScanManager] = useState(false);
    const [scanBarcode, setScanBarcode] = useState('');
    const [scannedProduct, setScannedProduct] = useState(null);
    const [isNewProduct, setIsNewProduct] = useState(false);
    
    // Quick Add Product Form State
    const [quickQtyToAdd, setQuickQtyToAdd] = useState('');
    const [quickName, setQuickName] = useState('');
    const [quickNameCkb, setQuickNameCkb] = useState('');
    const [quickPrice, setQuickPrice] = useState('');
    const [quickCategory, setQuickCategory] = useState('Snacks & Sweets');
    const [quickSubCategory, setQuickSubCategory] = useState('');
    const [quickUnit, setQuickUnit] = useState('piece');

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const { data } = await fetchProducts();
            if (data) {
                // Sanitize valid number prices
                const sanitized = data.map(p => ({
                    ...p,
                    price: Number(p.price) || 0
                }));
                setProducts(sanitized);
            }
        } catch (error) {
            console.error("Failed to load products", error);
            toast.error(t('common.error') || "Error loading products.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        console.log("Delete requested for ID:", id); // DEBUG

        if (id === undefined || id === null) {
            toast.error("Error: Cannot delete. Product ID is missing.");
            return;
        }

        // OPTIMISTIC UPDATE: Remove from UI immediately
        setProducts(current => {
            const updated = current.filter(p => p.id !== id);
            return updated;
        });

        // BACKGROUND actions...
        Promise.all([
            dbData.delete(id),
            dbData.delete(Number(id)),
            dbData.delete(String(id))
        ]).catch(err => console.warn("DB Delete Warning:", err));
        api.delete(`/products/${id}`).catch(err => console.warn("API Delete Warning:", err));
        toast.success("Product deleted");
    };

    const handleEdit = (product) => {
        setFormData({
            name: product.name,
            name_ckb: product.name_ckb || '',
            category: product.category,
            sub_category: product.sub_category || '',
            price: product.price,
            barcode: product.barcode || '',
            image_url: product.image_url || '',
            cashier_only: product.cashier_only || false,
            track_stock: product.track_stock === true || product.track_stock === 1,
            stock_quantity: product.stock_quantity !== undefined && product.stock_quantity !== null ? product.stock_quantity : '',
            description: product.description || 'piece',
            expiry_date: product.expiry_date || ''
        });
        setEditingId(product.id);
        setDeleteConfirm(false); // Reset delete state
        setShowForm(true);
    };

    const [isProcessing, setIsProcessing] = useState(false);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsProcessing(true);
            const reader = new FileReader();
            reader.onload = (event) => {
                setFormData(prev => ({ ...prev, image_url: event.target.result }));
                setIsProcessing(false);
            };
            reader.onerror = () => {
                toast.error("Failed to read file");
                setIsProcessing(false);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic Validation
        if (!formData.name || !formData.category) {
            toast.error("Please fill in all required fields.");
            return;
        }

        // Clean and Prepare Data
        let cleanPrice = parseFloat(formData.price);
        if (isNaN(cleanPrice)) cleanPrice = 0;

        const productData = {
            name: formData.name,
            name_ckb: formData.name_ckb || formData.name,
            category: formData.category,
            sub_category: formData.sub_category,
            barcode: formData.barcode || '',
            price: cleanPrice,
            image_url: formData.image_url || '',
            is_available: true,
            track_stock: formData.track_stock || false,
            stock_quantity: formData.track_stock ? (parseInt(formData.stock_quantity) || 0) : 0,
            description: formData.description || 'piece',
            expiry_date: formData.expiry_date || '',
            id: editingId || Date.now()
        };

        // Auto-add Brand Category
        if (formData.sub_category) {
            const currentCats = JSON.parse(localStorage.getItem('shisha_categories') || '[]');
            const exists = currentCats.some(c => (typeof c === 'string' ? c : c.name) === formData.sub_category);
            if (!exists) {
                localStorage.setItem('shisha_categories', JSON.stringify([...currentCats, { name: formData.sub_category, image: '' }]));
            }
        }

        try {
            // Optimistically update IndexedDB cache (non-blocking)
            dbData.addOrUpdate(productData).catch(err => console.warn("IndexedDB Add/Update warning:", err));

            if (editingId) {
                // Update
                const { data, error } = await api.put(`/products/${editingId}`, productData);
                if (error) throw new Error(String(error));
                const updatedProduct = data || { ...productData };
                setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...updatedProduct } : p));
                toast.success(t('products.updated') || "Product updated");
            } else {
                // Create — API returns single object
                const { id, ...createData } = productData;
                const { data, error } = await api.post('/products', createData);
                if (error) throw new Error(String(error));
                // Handle both array and single-object responses
                const newProduct = Array.isArray(data)
                    ? (data[0] || { ...productData, id: Date.now() })
                    : (data && data.id ? data : { ...productData, id: Date.now() });
                // Ensure IndexedDB has generated ID too
                if (newProduct.id !== productData.id) {
                    dbData.delete(productData.id).catch(() => {});
                    dbData.addOrUpdate(newProduct).catch(() => {});
                }
                setProducts(prev => [...prev, newProduct]);
                toast.success(t('products.created') || "Product created");
            }

            setShowForm(false);
            setFormData({ name: '', name_ckb: '', category: '', price: '', barcode: '', image_url: '', sub_category: '', cashier_only: false, track_stock: false, stock_quantity: '', description: 'piece', expiry_date: '' });
            setEditingId(null);
        } catch (error) {
            console.error("Product save error:", error);
            toast.error(`${t('common.error') || "Error"}: ${error.message || "Failed to save product"}`);
        }
    };

    const handleBarcodeSearchSubmit = (e) => {
        e.preventDefault();
        const code = scanBarcode.trim();
        if (!code) return;
        
        const match = (products || []).find(p => p.barcode === code);
        if (match) {
            setScannedProduct(match);
            setIsNewProduct(false);
            setQuickQtyToAdd('');
            setTimeout(() => {
                qtyInputRef.current?.focus();
            }, 150);
        } else {
            setScannedProduct(null);
            setIsNewProduct(true);
            setQuickName('');
            setQuickNameCkb('');
            setQuickPrice('');
            setQuickQtyToAdd('');
            setQuickUnit('piece');
            setTimeout(() => {
                nameInputRef.current?.focus();
            }, 150);
        }
    };

    const handleQuickStockSubmit = async (e) => {
        e.preventDefault();
        if (!scannedProduct || !quickQtyToAdd) return;
        
        const qtyVal = parseInt(quickQtyToAdd);
        if (isNaN(qtyVal) || qtyVal <= 0) {
            toast.error("Please enter a valid quantity.");
            return;
        }
        
        const currentQty = (scannedProduct.track_stock === true || scannedProduct.track_stock === 1) 
            ? (Number(scannedProduct.stock_quantity) || 0) 
            : 0;
        const newQty = currentQty + qtyVal;
        
        const productData = {
            ...scannedProduct,
            track_stock: true,
            stock_quantity: newQty
        };
        
        try {
            dbData.addOrUpdate(productData).catch(() => {});
            
            const { data, error } = await api.put(`/products/${scannedProduct.id}`, productData);
            if (error) throw new Error(String(error));
            
            const updated = data || productData;
            setProducts(prev => prev.map(p => p.id === scannedProduct.id ? { ...p, ...updated } : p));
            toast.success(`${scannedProduct.name_ckb || scannedProduct.name}: +${qtyVal} (${newQty})`);
            
            // Clear & re-focus
            setScanBarcode('');
            setScannedProduct(null);
            setIsNewProduct(false);
            setTimeout(() => {
                barcodeInputRef.current?.focus();
            }, 150);
        } catch (err) {
            console.error("Failed to update stock:", err);
            toast.error("Failed to update stock: " + err.message);
        }
    };

    const handleQuickCreateSubmit = async (e) => {
        e.preventDefault();
        const code = scanBarcode.trim();
        const ckbName = quickNameCkb.trim();
        const enName = quickName.trim() || ckbName;
        const priceVal = parseFloat(quickPrice);
        const qtyVal = parseInt(quickQtyToAdd) || 0;
        
        if (!code || !ckbName || isNaN(priceVal)) {
            toast.error("Please fill in all required fields.");
            return;
        }
        
        const productData = {
            name: enName,
            name_ckb: ckbName,
            category: quickCategory,
            sub_category: quickSubCategory.trim(),
            barcode: code,
            price: priceVal,
            image_url: '',
            is_available: true,
            track_stock: true,
            stock_quantity: qtyVal,
            description: quickUnit,
            id: Date.now()
        };
        
        // Auto-add brand category
        if (productData.sub_category) {
            const currentCats = JSON.parse(localStorage.getItem('shisha_categories') || '[]');
            const exists = currentCats.some(c => (typeof c === 'string' ? c : c.name) === productData.sub_category);
            if (!exists) {
                localStorage.setItem('shisha_categories', JSON.stringify([...currentCats, { name: productData.sub_category, image: '' }]));
            }
        }
        
        try {
            dbData.addOrUpdate(productData).catch(() => {});
            
            const { id, ...createData } = productData;
            const { data, error } = await api.post('/products', createData);
            if (error) throw new Error(String(error));
            
            const newProduct = Array.isArray(data)
                ? (data[0] || { ...productData, id: Date.now() })
                : (data && data.id ? data : { ...productData, id: Date.now() });
                
            if (newProduct.id !== productData.id) {
                dbData.delete(productData.id).catch(() => {});
                dbData.addOrUpdate(newProduct).catch(() => {});
            }
            
            setProducts(prev => [...prev, newProduct]);
            toast.success(`${newProduct.name_ckb || newProduct.name} created!`);
            
            // Clear & re-focus
            setScanBarcode('');
            setScannedProduct(null);
            setIsNewProduct(false);
            setQuickUnit('piece');
            setTimeout(() => {
                barcodeInputRef.current?.focus();
            }, 150);
        } catch (err) {
            console.error("Failed to create product:", err);
            toast.error("Failed to create product: " + err.message);
        }
    };

    return (
        <AdminGuard>
            <div className="h-full flex flex-col max-w-6xl mx-auto gap-6 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center flex-none">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-coffee-600 to-coffee-500 bg-clip-text text-transparent">{t('products.title')}</h1>
                    <div className="flex gap-2">
                        <Button 
                            className="aurora-glow hover:scale-102 transition-transform bg-cyan-600 hover:bg-cyan-700 text-white" 
                            onClick={() => {
                                setShowScanManager(!showScanManager);
                                setShowForm(false);
                                setEditingId(null);
                                setScanBarcode('');
                                setScannedProduct(null);
                                setIsNewProduct(false);
                                if (!showScanManager) {
                                    setTimeout(() => {
                                        barcodeInputRef.current?.focus();
                                    }, 200);
                                }
                            }}
                        >
                            <Package size={20} className="inline mr-2" />
                            {showScanManager ? t('common.cancel') : "سکانکردنی مەخزەن (Scan Stock)"}
                        </Button>

                        <Button className="aurora-glow hover:scale-102 transition-transform animate-fade-in" onClick={() => {
                            setShowForm(!showForm);
                            setShowScanManager(false);
                            setEditingId(null);
                            setFormData({ name: '', name_ckb: '', category: '', price: '', barcode: '', image_url: '', sub_category: '', cashier_only: false, track_stock: false, stock_quantity: '', description: 'piece', expiry_date: '' });
                        }}>
                            <Plus size={20} className="inline mr-2" />
                            {showForm && !editingId ? t('common.cancel') : t('products.add_product')}
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    <div className="grid grid-cols-1 gap-8 pb-4">
                        {/* Quick Barcode Stock Manager */}
                        {showScanManager && (
                            <div className="glass-panel p-6 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/80 animate-fade-in">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold dark:text-gray-100 flex items-center gap-2">
                                        <Package size={22} className="text-coffee-600 dark:text-coffee-400" />
                                        سکانکردن و داخڵکردنی خێرا (Quick Barcode Stock Manager)
                                    </h3>
                                    <button 
                                        type="button"
                                        onClick={() => {
                                            setShowScanManager(false);
                                            setScanBarcode('');
                                            setScannedProduct(null);
                                            setIsNewProduct(false);
                                        }}
                                        className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                                    >
                                        {t('common.close', 'Close')}
                                    </button>
                                </div>
                                
                                <form onSubmit={handleBarcodeSearchSubmit} className="flex gap-2 items-end mb-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            سکانکردنی بارکۆد (Scan Barcode)
                                        </label>
                                        <input
                                            ref={barcodeInputRef}
                                            type="text"
                                            placeholder="Scan barcode or type and press Enter..."
                                            value={scanBarcode}
                                            onChange={e => setScanBarcode(e.target.value)}
                                            className="w-full p-2.5 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                            autoComplete="off"
                                        />
                                    </div>
                                    <Button type="submit" variant="secondary">
                                        گەڕان (Search)
                                    </Button>
                                </form>

                                {/* Existing Product Found */}
                                {scannedProduct && (
                                    <div className="p-4 bg-coffee-50/20 dark:bg-coffee-950/10 border border-coffee-150 dark:border-coffee-900/40 rounded-xl animate-fade-in">
                                        <h4 className="font-bold text-coffee-700 dark:text-coffee-400 mb-3 text-sm">
                                            بەرهەمەکە دۆزرایەوە: {i18n.language === 'ckb' ? (scannedProduct.name_ckb || scannedProduct.name) : scannedProduct.name}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs text-gray-600 dark:text-gray-400">
                                            <div><strong>بارکۆد:</strong> {scannedProduct.barcode}</div>
                                            <div><strong>نرخ:</strong> {scannedProduct.price.toLocaleString()} {t('common.currency')}</div>
                                            <div><strong>بڕی ئێستا لە مەخزەن:</strong> {scannedProduct.track_stock ? `${scannedProduct.stock_quantity} ${getUnitText(scannedProduct.description, scannedProduct.stock_quantity, t)}` : 'مەخزەنی بۆ چالاک نەکراوە'}</div>
                                        </div>

                                        <form onSubmit={handleQuickStockSubmit} className="flex gap-4 items-end">
                                            <div className="flex-1">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    چەند {getUnitText(scannedProduct.description, 1, t)} بۆ کۆگا زیاد دەبێت؟ (Quantity to Add)
                                                </label>
                                                <input
                                                    ref={qtyInputRef}
                                                    type="number"
                                                    placeholder="e.g. 10, 50, 100"
                                                    value={quickQtyToAdd}
                                                    onChange={e => setQuickQtyToAdd(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                    required
                                                    min="1"
                                                />
                                            </div>
                                            <Button type="submit">زیادکردن بۆ مەخزەن</Button>
                                        </form>
                                    </div>
                                )}

                                {/* New Product (Create automatically) */}
                                {isNewProduct && (
                                    <div className="p-4 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-150 dark:border-blue-900/40 rounded-xl animate-fade-in">
                                        <h4 className="font-bold text-blue-700 dark:text-blue-400 mb-3 text-sm">
                                            بەرهەمی نوێ! بارکۆد: {scanBarcode}
                                        </h4>
                                        
                                        <form onSubmit={handleQuickCreateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    ناوی بەرهەم بە کوردی (Name CKB) *
                                                </label>
                                                <input
                                                    ref={nameInputRef}
                                                    type="text"
                                                    placeholder="e.g. کۆکا کۆلا"
                                                    value={quickNameCkb}
                                                    onChange={e => setQuickNameCkb(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white font-kurdish"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    ناوی بەرهەم بە ئینگلیزی (Name EN)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Coca Cola"
                                                    value={quickName}
                                                    onChange={e => setQuickName(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    نرخ (Price) *
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 500"
                                                    value={quickPrice}
                                                    onChange={e => setQuickPrice(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    پۆل / هاوپۆل (Category)
                                                </label>
                                                <select
                                                    value={quickCategory}
                                                    onChange={e => setQuickCategory(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                >
                                                    {['Snacks & Sweets', 'Beverages', 'Dairy & Cheese', 'Pantry & Grains', 'Bakery', 'Household & Cleaning'].map(cat => (
                                                        <option key={cat} value={cat}>{t(`categories.${cat}`) || cat}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    براند یان کۆمپانیا (Brand / Sub-category)
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Coca-Cola Company"
                                                    value={quickSubCategory}
                                                    onChange={e => setQuickSubCategory(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    بڕی مەخزەن بۆ زیادکردن (Initial Stock Quantity)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="e.g. 50"
                                                    value={quickQtyToAdd}
                                                    onChange={e => setQuickQtyToAdd(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                                    {t('products.unit') || "Unit (یەکەی پێوانە)"}
                                                </label>
                                                <select
                                                    value={quickUnit}
                                                    onChange={e => setQuickUnit(e.target.value)}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                >
                                                    <option value="piece">{t('units.piece') || "Piece (دانە)"}</option>
                                                    <option value="carton">{t('units.carton') || "Carton (کارتۆن)"}</option>
                                                    <option value="kilo">{t('units.kilo') || "KG (کیلۆ)"}</option>
                                                    <option value="pack">{t('units.pack') || "Pack (پاکەت)"}</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                                <Button type="button" variant="secondary" onClick={() => setIsNewProduct(false)}>پاشگەزبوونەوە</Button>
                                                <Button type="submit">دروستکردن و خەزنکردن</Button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Product Form */}
                        {
                            showForm && (
                                <div className="glass-panel p-6 rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/80 animate-fade-in">
                                    <h3 className="text-lg font-bold mb-4 dark:text-gray-100">{editingId ? t('products.edit_product') : t('products.new_product')}</h3>
                                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input
                                            label={t('products.name')}
                                            placeholder="e.g. Latte"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                        <Input
                                            label={t('products.name_ckb')}
                                            placeholder="e.g. نێرگەلە"
                                            value={formData.name_ckb || ''}
                                            onChange={e => setFormData({ ...formData, name_ckb: e.target.value })}
                                            className="font-kurdish"
                                        />
                                        <Input
                                            label="Barcode"
                                            placeholder="e.g. 8690500123456"
                                            value={formData.barcode || ''}
                                            onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                        />
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.category')}</label>
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                required
                                            >
                                                <option value="" disabled>{t('products.select_category')}</option>
                                                {['Snacks & Sweets', 'Beverages', 'Dairy & Cheese', 'Pantry & Grains', 'Bakery', 'Household & Cleaning'].map(cat => (
                                                    <option key={cat} value={cat}>{t(`categories.${cat}`) || cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('products.shisha_type') || "Brand / Manufacturer"}</label>
                                            <div className="relative">
                                                <input
                                                    list="brand-types"
                                                    value={formData.sub_category}
                                                    onChange={e => setFormData({ ...formData, sub_category: e.target.value })}
                                                    placeholder={t('products.select_type') || "e.g. Nestle, Unilever..."}
                                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                                />
                                                <datalist id="brand-types">
                                                    {JSON.parse(localStorage.getItem('shisha_categories') || '["Nestle", "PepsiCo", "Almarai", "Kraft", "Unilever"]').map(type => {
                                                        const val = typeof type === 'string' ? type : type.name;
                                                        return <option key={val} value={val} />;
                                                    })}
                                                </datalist>
                                            </div>
                                        </div>
                                        <Input
                                            label={t('cashier.price')}
                                            type="number"
                                            step="0.01"
                                            placeholder="0"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                        <div className="flex flex-col gap-1">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('products.unit') || "Unit (یەکەی پێوانە)"}
                                            </label>
                                            <select
                                                value={formData.description || 'piece'}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="p-2 border border-gray-300 dark:border-gray-650 rounded-lg outline-none focus:ring-2 focus:ring-coffee-500 bg-gray-50 dark:bg-gray-700 dark:text-white"
                                            >
                                                <option value="piece">{t('units.piece') || "Piece (دانە)"}</option>
                                                <option value="carton">{t('units.carton') || "Carton (کارتۆن)"}</option>
                                                <option value="kilo">{t('units.kilo') || "KG (کیلۆ)"}</option>
                                                <option value="pack">{t('units.pack') || "Pack (پاکەت)"}</option>
                                            </select>
                                        </div>
                                        <Input
                                            label="ڕێکەوتی بەسەرچوون"
                                            type="date"
                                            value={formData.expiry_date || ''}
                                            onChange={e => setFormData({ ...formData, expiry_date: e.target.value })}
                                        />

                                        {/* Cashier Only Toggle */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <input
                                                type="checkbox"
                                                id="cashier_only"
                                                checked={formData.cashier_only}
                                                onChange={e => setFormData({ ...formData, cashier_only: e.target.checked })}
                                                className="w-5 h-5 text-coffee-500 bg-slate-55 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-coffee-500"
                                            />
                                            <label htmlFor="cashier_only" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {t('products.cashier_only') || "Cashier Only (Hide from Captain)"}
                                            </label>
                                        </div>

                                         {/* Stock Field */}
                                         <div className="flex flex-col gap-4 mt-2 p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-lg border border-slate-200/50 dark:border-slate-800/60">
                                             <div className="flex items-center gap-2">
                                                 <input
                                                     type="checkbox"
                                                     id="track_stock"
                                                     checked={formData.track_stock}
                                                     onChange={e => setFormData({ ...formData, track_stock: e.target.checked })}
                                                     className="w-5 h-5 text-coffee-500 bg-slate-55 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-coffee-500"
                                                 />
                                                 <label htmlFor="track_stock" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                     {t('stock.track') || "Track Stock (کۆنتڕۆڵکردنی مەخزەن)"}
                                                 </label>
                                             </div>
                                             {formData.track_stock && (
                                                 <div className="animate-fade-in">
                                                     <Input
                                                         type="number"
                                                         label={t('stock.quantity') || "Stock Quantity (بڕی مەخزەن)"}
                                                         value={formData.stock_quantity}
                                                         onChange={e => setFormData({ ...formData, stock_quantity: e.target.value })}
                                                         placeholder="e.g. 50"
                                                         required
                                                     />
                                                 </div>
                                             )}
                                         </div>


                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('products.image')}</label>
                                            <div className="flex gap-2 items-start">
                                                <div className="flex-1">
                                                    <Input
                                                        placeholder="https://..."
                                                        // Show a friendly message if it's a long data URL
                                                        value={formData.image_url}
                                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                                        disabled={isProcessing}
                                                    />
                                                </div>

                                                <label className={`cursor-pointer bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center transition-colors hover-lift ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isProcessing} />
                                                    {isProcessing ? (
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-coffee-500"></div>
                                                    ) : (
                                                        <UploadSimple size={24} className="text-gray-600 dark:text-gray-300" />
                                                    )}
                                                </label>
                                            </div>

                                            {/* Preview */}
                                            {formData.image_url && (
                                                <div className="mt-2 w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-900/60 shadow-sm">
                                                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="md:col-span-2 flex justify-between gap-2 mt-2">
                                            {editingId && (
                                                deleteConfirm ? (
                                                    <div className="flex gap-2 items-center animate-fade-in">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleDelete(editingId);
                                                                setShowForm(false);
                                                                setEditingId(null);
                                                                setFormData({ name: '', name_ckb: '', category: '', price: '', barcode: '', image_url: '', sub_category: '', cashier_only: false, track_stock: false, stock_quantity: '', description: 'piece', expiry_date: '' });
                                                            }}
                                                            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors text-sm font-bold shadow-md shadow-red-500/10 hover-lift"
                                                        >
                                                            {t('common.confirm_delete') || "Are you sure?"}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteConfirm(false)}
                                                            className="px-3 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 rounded-lg transition-colors text-sm"
                                                        >
                                                            {t('common.cancel') || "Cancel"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeleteConfirm(true)}
                                                        className="px-4 py-2 bg-red-50 text-red-650 hover:bg-red-100 border border-red-200 dark:bg-red-955/15 dark:text-red-400 dark:border-red-900/40 rounded-lg transition-colors flex items-center gap-2 hover-lift font-semibold text-sm"
                                                        disabled={isProcessing}
                                                    >
                                                        <Trash size={18} />
                                                        {t('common.delete') || "Delete"}
                                                    </button>
                                                )
                                            )}
                                            <div className="flex gap-2 ml-auto">
                                                <Button type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={isProcessing}>{t('common.cancel')}</Button>
                                                <Button type="submit" disabled={isProcessing} className={`aurora-glow hover:scale-102 transition-transform ${isProcessing ? "opacity-75 cursor-wait" : ""}`}>
                                                    {isProcessing ? (t('common.saving') || "Saving...") : t('products.save_product')}
                                                </Button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            )
                        }

                        {/* Product List */}
                        <div className="glass-panel rounded-2xl shadow-lg border border-slate-200/60 dark:border-slate-800/80 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200/50 dark:border-slate-800 sticky top-0 z-10">
                                    <tr>
                                        <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-left rtl:text-right uppercase tracking-wider text-xs">{t('products.image')}</th>
                                        <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-left rtl:text-right uppercase tracking-wider text-xs">{t('products.name')}</th>
                                        <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-left rtl:text-right uppercase tracking-wider text-xs">{t('products.category')}</th>
                                        <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-left rtl:text-right uppercase tracking-wider text-xs">{t('cashier.price')}</th>
                                        <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-left rtl:text-right uppercase tracking-wider text-xs">{t('stock.title') || "Stock"}</th>
                                        <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-right rtl:text-left uppercase tracking-wider text-xs">{t('common.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/60">
                                    {loading ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                                    ) : (products || []).map((product) => (
                                        <tr key={product.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-all duration-150">
                                            <td className="p-4 text-left rtl:text-right">
                                                <div className="w-12 h-12 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200/30 dark:border-slate-800/60 overflow-hidden inline-block shadow-sm">
                                                    {product.image_url ? (
                                                        <img 
                                                            src={product.image_url} 
                                                            alt={product.name} 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = 'https://images.unsplash.com/photo-1607619056574-7b8f30413736?auto=format&fit=crop&q=80&w=200';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                                            <Package size={20} weight="duotone" />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-left rtl:text-right">
                                                {i18n.language === 'ckb' ? (product.name_ckb || product.name) : product.name}
                                            </td>
                                            <td className="p-4 text-gray-600 dark:text-gray-400 text-left rtl:text-right">
                                                <span className="px-2.5 py-1 bg-slate-100/50 dark:bg-slate-800/40 text-slate-655 dark:text-slate-350 border border-slate-200/35 dark:border-slate-700/40 rounded-full text-[10px] uppercase font-black tracking-wider">
                                                    {t(`categories.${product.category}`) || product.category}
                                                </span>
                                            </td>
                                            <td className="p-4 font-semibold text-gray-900 dark:text-gray-100 text-left rtl:text-right">{(Number(product.price) || 0).toLocaleString()} {t('common.currency')}</td>
                                            <td className="p-4 text-left rtl:text-right">
                                                {product.track_stock === true || product.track_stock === 1 ? (
                                                    <span style={{fontSize:'16px', fontWeight:'600'}} className={
                                                        Number(product.stock_quantity) <= 0 
                                                            ? 'text-red-500 dark:text-red-400' 
                                                            : Number(product.stock_quantity) < 5 
                                                                ? 'text-orange-500 dark:text-orange-400'
                                                                : 'text-gray-700 dark:text-gray-300'
                                                    }>
                                                        {Number(product.stock_quantity) <= 0 ? (t('stock.out_of_stock') || "Out of Stock") : `${product.stock_quantity} ${getUnitText(product.description, product.stock_quantity, t)}`}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500 text-xs italic">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right rtl:text-left space-x-2 rtl:space-x-reverse">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                >
                                                    <Pencil size={20} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {!loading && products.length === 0 && (
                                <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t('products.no_products')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
};

export default AdminProducts;
