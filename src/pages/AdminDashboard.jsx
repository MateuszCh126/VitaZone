import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingBag,
    Users,
    Settings,
    TrendingUp,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    ChevronRight,
    Search,
    Filter,
    Eye,
    EyeOff
} from 'lucide-react';
import { API_BASE } from '../utils/config';
import ProductModal from '../components/ProductModal';
import AdminDiscounts from '../components/admin/AdminDiscounts';
import { ORDER_STATUS, PROCESSING_ORDER_STATUSES } from '../../shared/orderStatus.js';

const AdminDashboard = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('orders');
    const [isLoading, setIsLoading] = useState(true);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [isOrderDetailsLoading, setIsOrderDetailsLoading] = useState(false);
    const [orderDetailsError, setOrderDetailsError] = useState('');

    // Sorting State
    const [sortConfig, setSortConfig] = useState({ key: 'totalSpent', direction: 'desc' });

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
            return;
        }

        const fetchAdminData = async () => {
            try {
                const apiBase = API_BASE;
                const opts = { credentials: 'include' };

                const [statsRes, ordersRes, productsRes, usersRes] = await Promise.all([
                    fetch(`${apiBase}/api/admin/stats`, opts),
                    fetch(`${apiBase}/api/admin/orders`, opts),
                    fetch(`${apiBase}/api/admin/products`, opts),
                    fetch(`${apiBase}/api/admin/users`, opts)
                ]);

                if (statsRes.ok && ordersRes.ok && productsRes.ok && usersRes.ok) {
                    setStats(await statsRes.json());
                    setOrders(await ordersRes.json());
                    setProducts(await productsRes.json());
                    setUsers(await usersRes.json());
                }
            } catch (error) {
                console.error('Failed to fetch admin data', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdminData();
    }, [authLoading, user, navigate]);

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            const apiBase = API_BASE;
            const res = await fetch(`${apiBase}/api/admin/orders/${orderId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            }
        } catch (error) {
            console.error('Update status failed', error);
        }
    };

    const handleOpenOrderDetails = async (orderId) => {
        setIsOrderDetailsOpen(true);
        setOrderDetailsError('');
        setIsOrderDetailsLoading(true);
        setSelectedOrderDetails(null);

        try {
            const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}`, {
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Nie udało się pobrać szczegółów zamówienia');
            }

            const data = await res.json();
            setSelectedOrderDetails(data);
        } catch (error) {
            setOrderDetailsError(error.message || 'Nie udało się pobrać szczegółów zamówienia');
        } finally {
            setIsOrderDetailsLoading(false);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!confirm('Czy na pewno chcesz usunąć ten produkt?')) return;
        try {
            const apiBase = API_BASE;
            const res = await fetch(`${apiBase}/api/admin/products/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error('Delete failed', error);
        }
    };

    const handleToggleActive = async (product) => {
        try {
            const apiBase = API_BASE;
            const res = await fetch(`${apiBase}/api/admin/products/${product.id}/toggle-active`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ isActive: !product.is_active })
            });

            if (res.ok) {
                const updated = await res.json();
                setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: updated.is_active } : p));
            }
        } catch (error) {
            console.error('Toggle failed', error);
        }
    };

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchCategories = async () => {
            const res = await fetch(`${API_BASE}/api/categories`);
            if (res.ok) setCategories(await res.json());
        };
        fetchCategories();
    }, []);

    const handleSaveProduct = async (productData) => {
        try {
            const method = editingProduct ? 'PUT' : 'POST';
            const url = editingProduct
                ? `${API_BASE}/api/admin/products/${editingProduct.id}`
                : `${API_BASE}/api/admin/products`;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(productData)
            });

            if (res.ok) {
                const savedProduct = await res.json();
                if (editingProduct) {
                    setProducts(prev => prev.map(p => p.id === savedProduct.id ? savedProduct : p));
                } else {
                    setProducts(prev => [savedProduct, ...prev]);
                }
                setIsProductModalOpen(false);
                setEditingProduct(null);
            } else {
                console.error('Save failed', await res.text());
            }
        } catch (error) {
            console.error('Save product error', error);
        }
    };

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedUsers = [...users].sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        // Handle dates
        if (sortConfig.key === 'joined') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ column }) => {
        if (sortConfig.key !== column) return <div className="w-4 h-4 inline-block" />;
        return sortConfig.direction === 'asc'
            ? <span className="text-xs ml-1 inline-block">▲</span>
            : <span className="text-xs ml-1 inline-block">▼</span>;
    };


    if (authLoading) return <div className="min-h-screen flex items-center justify-center">Ładowanie panelu admina...</div>;
    if (!user || user.role !== 'admin') return null;
    if (isLoading) return <div className="min-h-screen flex items-center justify-center">Ładowanie panelu admina...</div>;

    return (
        <div className="container mx-auto px-6 py-12 min-h-screen">
            {/* ... stats ... */}
            <div className="flex items-center gap-4 mb-12">
                <div className="p-3 bg-primary/10 rounded-xl">
                    <LayoutDashboard className="text-primary" size={32} />
                </div>
                <div>
                    <h1 className="text-4xl font-bold">Zarządzanie sklepem</h1>
                    <p className="text-gray-500">Status sklepu: <span className="text-green-500 font-bold uppercase text-xs tracking-widest ml-1">Aktywny</span></p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <StatCard
                    icon={<TrendingUp className="text-green-500" />}
                    label="Całkowity przychód"
                    value={`${Number(stats?.totalRevenue || 0).toLocaleString('pl-PL')} zł`}
                    subtext={`${stats?.revenueGrowth || 0}% od ostatniego miesiąca`}
                />
                <StatCard
                    icon={<ShoppingBag className="text-primary" />}
                    label="Wszystkie zamówienia"
                    value={stats?.totalOrders || 0}
                    subtext={`W realizacji: ${stats?.ordersProcessing || 0}`}
                />
                <StatCard
                    icon={<Users className="text-blue-500" />}
                    label="Aktywni użytkownicy"
                    value={stats?.activeUsers || 0}
                    subtext="Aktywni (ostatnie 20 min)"
                />
                <StatCard
                    icon={<Package className="text-orange-500" />}
                    label="Asortyment"
                    value={products.length}
                    subtext="Unikalne Gatunki"
                />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Tabs */}
                <div className="lg:w-64 space-y-2">
                    <TabButton active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} icon={<Clock size={18} />} label="Wszystkie zamówienia" />
                    <TabButton active={activeTab === 'process'} onClick={() => setActiveTab('process')} icon={<CheckCircle size={18} />} label="Do obsłużenia" />
                    <TabButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package size={18} />} label="Magazyn" />
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={<Users size={18} />} label="Użytkownicy" />
                    <TabButton active={activeTab === 'discounts'} onClick={() => setActiveTab('discounts')} icon={<TrendingUp size={18} />} label="Kupony" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {activeTab === 'orders' && (
                            <motion.div
                                key="orders"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-bold">Kolejka zamówień</h2>
                                    <div className="flex gap-2">
                                        <div className="glass px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                            <Search size={14} className="text-gray-500" />
                                            <input className="bg-transparent border-none outline-none text-xs" placeholder="Szukaj zamówień..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {orders.map(order => (
                                        <div key={order.id} className="glass p-6 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                                            <div className="flex flex-col md:flex-row justify-between gap-6">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                        <ShoppingBag size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold">{order.user_email}</h3>
                                                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-400 font-mono italic">#{order.id.slice(0, 8)}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-400">{new Date(order.created_at).toLocaleDateString()} o {new Date(order.created_at).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <div className="text-xl font-bold mb-1">{order.total_amount} zł</div>
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">{order.payment_method}</div>
                                                    </div>
                                                    <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>
                                                    <div className="flex flex-col gap-2">
                                                        <select
                                                            value={order.status}
                                                            onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                                            disabled={[ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.REFUNDED].includes(order.status)}
                                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 bg-black/50 outline-none transition-colors ${getStatusColor(order.status)} appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
                                                            style={{ colorScheme: 'dark' }}
                                                        >
                                                            <option value="payment_pending" className="bg-gray-900 text-yellow-300">OCZEKUJE NA PŁATNOŚĆ</option>
                                                            <option value="pending" className="bg-gray-900 text-yellow-500">OCZEKUJĄCE</option>
                                                            <option value="accepted" className="bg-gray-900 text-blue-400">PRZYJĘTE</option>
                                                            <option value="processing" className="bg-gray-900 text-blue-500">W REALIZACJI</option>
                                                            <option value="ready" className="bg-gray-900 text-purple-400">GOTOWE DO WYSYŁKI</option>
                                                            <option value="shipped" className="bg-gray-900 text-purple-500">WYSŁANE</option>
                                                            <option value="completed" className="bg-gray-900 text-green-500">ZAKOŃCZONE</option>
                                                            <option value="refunded" className="bg-gray-900 text-orange-400">ZWROT WYKONANY</option>
                                                            <option value="cancelled" className="bg-gray-900 text-red-500">ANULOWANE</option>
                                                        </select>
                                                        <button
                                                            onClick={() => handleOpenOrderDetails(order.id)}
                                                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 bg-black/40 hover:bg-white/10 transition-colors"
                                                        >
                                                            Szczegóły
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                        )}

                        {activeTab === 'process' && (
                            <motion.div
                                key="process"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-bold mb-6">Zamówienia do obsłużenia</h2>
                                <div className="space-y-4">
                                    {orders.filter(o => PROCESSING_ORDER_STATUSES.includes(o.status)).map(order => (
                                        <div key={order.id} className="glass p-6 rounded-2xl border border-white/5 bg-primary/5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <div className="font-bold text-lg">#{order.id.slice(0, 8)}</div>
                                                    <div className="text-gray-400 text-sm">{order.user_email}</div>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)} border`}>
                                                    {translateStatus(order.status)}
                                                </div>
                                            </div>

                                            {/* Order Details Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-sm">
                                                {/* Items List */}
                                                <div className="glass p-4 rounded-lg">
                                                    <div className="text-gray-500 text-xs uppercase mb-2 font-bold">Produkty</div>
                                                    <ul className="space-y-2">
                                                        {Array.isArray(order.items) && order.items.map((item, idx) => (
                                                            <li key={idx} className="flex justify-between text-gray-300">
                                                                <span><span className="text-primary font-bold">{item.quantity}x</span> {item.name || 'Produkt'}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Shipping Info */}
                                                <div className="glass p-4 rounded-lg">
                                                    <div className="text-gray-500 text-xs uppercase mb-2 font-bold">Wysyłka</div>
                                                    {order.shipping_address_json ? (
                                                        <div className="text-gray-300">
                                                            <p>{order.shipping_address_json.country}, {order.shipping_address_json.city}</p>
                                                            <p>{order.shipping_address_json.street} {order.shipping_address_json.house_number} {order.shipping_address_json.apartment_number && `/ ${order.shipping_address_json.apartment_number}`}</p>
                                                            <p>{order.shipping_address_json.postal_code}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 italic">Brak adresu</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-6 text-sm">
                                                <div className="glass p-3 rounded-lg text-center">
                                                    <div className="text-gray-500 text-xs uppercase mb-1">Data</div>
                                                    <div className="font-mono">{new Date(order.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div className="glass p-3 rounded-lg text-center">
                                                    <div className="text-gray-500 text-xs uppercase mb-1">Kwota</div>
                                                    <div className="font-mono text-primary font-bold">{parseFloat(order.total_amount).toFixed(2)} zł</div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                {order.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'accepted')}
                                                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20"
                                                    >
                                                        Przyjmij zamówienie
                                                    </button>
                                                )}
                                                {order.status === 'accepted' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'processing')}
                                                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-3 rounded-lg font-bold transition-all shadow-lg shadow-yellow-500/20"
                                                    >
                                                        Rozpocznij Pakowanie
                                                    </button>
                                                )}
                                                {order.status === 'processing' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                                                        className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-purple-500/20"
                                                    >
                                                        Gotowe do wysyłki
                                                    </button>
                                                )}
                                                {order.status === 'ready' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(order.id, 'shipped')}
                                                        className="flex-1 bg-green-500 hover:bg-green-600 text-black py-3 rounded-lg font-bold transition-all shadow-lg shadow-green-500/20"
                                                    >
                                                        Wysłane
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {orders.filter(o => PROCESSING_ORDER_STATUSES.includes(o.status)).length === 0 && (
                                        <div className="text-center text-gray-500 py-12">
                                            Brak zamówień wymagających obsługi.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'inventory' && (
                            <motion.div
                                key="inventory"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold">Zarządzanie asortymentem</h2>
                                    <button
                                        onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
                                        className="bg-primary text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-white transition-colors"
                                    >
                                        + Dodaj nowy gatunek
                                    </button>
                                </div>

                                <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="p-4">Produkt</th>
                                                <th className="p-4">Kategoria</th>
                                                <th className="p-4">Cena</th>
                                                <th className="p-4">Dostępność</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4 text-right">Akcje</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {products.map(product => (
                                                <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 flex items-center gap-3">
                                                        <img src={product.image_urls?.[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover bg-white/10" />
                                                        <span className="font-bold">{product.name}</span>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400">{product.category_name || 'Brak'}</td>
                                                    <td className="p-4 font-mono">{product.price} zł</td>
                                                    <td className="p-4">
                                                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${product.stock > 10 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                            {product.stock} szt.
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            onClick={() => handleToggleActive(product)}
                                                            className={`flex items-center gap-2 text-xs font-bold px-2 py-1 rounded transition-colors ${product.is_active
                                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                                : 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
                                                                }`}
                                                        >
                                                            {product.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                                                            {product.is_active ? 'Widoczny' : 'Ukryty'}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 text-right space-x-2">
                                                        <button
                                                            onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }}
                                                            className="text-primary hover:text-white text-xs underline"
                                                        >
                                                            Edytuj
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProduct(product.id)}
                                                            className="text-red-500 hover:text-red-400 text-xs underline"
                                                        >
                                                            Usuń
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'users' && (
                            <motion.div
                                key="users"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <h2 className="text-2xl font-bold">Analityka użytkowników</h2>
                                <div className="glass rounded-2xl border border-white/5 overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider cursor-pointer">
                                            <tr>
                                                <th className="p-4 hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                                    <div className="flex items-center gap-1">Użytkownik <SortIcon column="name" /></div>
                                                </th>
                                                <th className="p-4 hover:text-white transition-colors" onClick={() => handleSort('role')}>
                                                    <div className="flex items-center gap-1">Rola <SortIcon column="role" /></div>
                                                </th>
                                                <th className="p-4 hover:text-white transition-colors" onClick={() => handleSort('joined')}>
                                                    <div className="flex items-center gap-1">Dołączył <SortIcon column="joined" /></div>
                                                </th>
                                                <th className="p-4 hover:text-white transition-colors" onClick={() => handleSort('orderCount')}>
                                                    <div className="flex items-center gap-1">Zamówienia <SortIcon column="orderCount" /></div>
                                                </th>
                                                <th className="p-4 hover:text-white transition-colors" onClick={() => handleSort('totalSpent')}>
                                                    <div className="flex items-center gap-1">Wydatki <SortIcon column="totalSpent" /></div>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {sortedUsers.map(u => (
                                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4">
                                                        <div className="font-bold">{u.name}</div>
                                                        <div className="text-xs text-gray-500">{u.email}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${u.role === 'admin' ? 'bg-primary/20 text-primary' : 'bg-white/10 text-gray-400'}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-400">{new Date(u.joined).toLocaleDateString()}</td>
                                                    <td className="p-4 font-bold">{u.orderCount}</td>
                                                    <td className="p-4 font-mono text-green-500">{u.totalSpent.toFixed(2)} zł</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}
                        {activeTab === 'discounts' && <AdminDiscounts />}
                    </AnimatePresence>
                </div>
            </div>

            <AnimatePresence>
                {isOrderDetailsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm p-4 md:p-8 overflow-y-auto"
                        onClick={() => setIsOrderDetailsOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="mx-auto max-w-3xl glass rounded-2xl border border-white/10 p-6"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-2xl font-bold">Szczegóły zamówienia</h3>
                                <button
                                    onClick={() => setIsOrderDetailsOpen(false)}
                                    className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-sm"
                                >
                                    Zamknij
                                </button>
                            </div>

                            {isOrderDetailsLoading && (
                                <div className="text-sm text-gray-400">Ładowanie szczegółów...</div>
                            )}

                            {!isOrderDetailsLoading && orderDetailsError && (
                                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                                    {orderDetailsError}
                                </div>
                            )}

                            {!isOrderDetailsLoading && !orderDetailsError && selectedOrderDetails && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="glass rounded-xl p-4">
                                            <div className="text-xs uppercase text-gray-500 mb-2">Klient</div>
                                            <div className="font-bold">{selectedOrderDetails.user_email}</div>
                                            <div className="text-gray-400">
                                                {(selectedOrderDetails.first_name || selectedOrderDetails.last_name)
                                                    ? `${selectedOrderDetails.first_name || ''} ${selectedOrderDetails.last_name || ''}`.trim()
                                                    : (selectedOrderDetails.shipping_address_json?.full_name || 'Brak imienia i nazwiska')}
                                            </div>
                                        </div>
                                        <div className="glass rounded-xl p-4">
                                            <div className="text-xs uppercase text-gray-500 mb-2">Płatność i status</div>
                                            <div className="font-bold">{Number(selectedOrderDetails.total_amount || 0).toFixed(2)} zł</div>
                                            <div className="text-gray-400">{translateStatus(selectedOrderDetails.status)}</div>
                                            <div className="text-[11px] uppercase tracking-wider text-gray-500 mt-1">{selectedOrderDetails.payment_method}</div>
                                        </div>
                                    </div>

                                    <div className="glass rounded-xl p-4 text-sm">
                                        <div className="text-xs uppercase text-gray-500 mb-2">Adres dostawy</div>
                                        {selectedOrderDetails.shipping_address_json ? (
                                            <div className="space-y-1 text-gray-300">
                                                <div>{selectedOrderDetails.shipping_address_json.country}, {selectedOrderDetails.shipping_address_json.city}</div>
                                                <div>
                                                    {selectedOrderDetails.shipping_address_json.street} {selectedOrderDetails.shipping_address_json.house_number}
                                                    {selectedOrderDetails.shipping_address_json.apartment_number ? ` / ${selectedOrderDetails.shipping_address_json.apartment_number}` : ''}
                                                </div>
                                                <div>{selectedOrderDetails.shipping_address_json.postal_code}</div>
                                                {selectedOrderDetails.shipping_address_json.email && (
                                                    <div className="text-gray-400">Email do kontaktu: {selectedOrderDetails.shipping_address_json.email}</div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 italic">Brak danych adresowych.</div>
                                        )}
                                    </div>

                                    <div className="glass rounded-xl p-4 text-sm">
                                        <div className="text-xs uppercase text-gray-500 mb-2">Pozycje zamówienia</div>
                                        <div className="space-y-2">
                                            {(selectedOrderDetails.items || []).map((item) => (
                                                <div key={item.id} className="flex justify-between gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0">
                                                    <div>
                                                        <span className="text-primary font-bold">{item.quantity}x</span> {item.name || 'Produkt'}
                                                    </div>
                                                    <div className="font-mono">{Number((item.price || 0) * item.quantity).toFixed(2)} zł</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <ProductModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                onSubmit={handleSaveProduct}
                editingProduct={editingProduct}
                categories={categories}
            />
        </div >
    );
};

const StatCard = ({ icon, label, value, subtext }) => (
    <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            {React.cloneElement(icon, { size: 64 })}
        </div>
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/5 rounded-lg">{icon}</div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">{label}</span>
        </div>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <div className="text-[10px] text-gray-500">{subtext}</div>
    </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${active ? 'bg-primary text-black font-bold shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
    >
        <div className="flex items-center gap-3">
            {icon} {label}
        </div>
        <ChevronRight size={16} className={active ? 'opacity-100' : 'opacity-0'} />
    </button>
);

const getStatusColor = (status) => {
    switch (status) {
        case ORDER_STATUS.PAYMENT_PENDING: return 'text-yellow-300 border-yellow-300/20';
        case 'pending': return 'text-yellow-500 border-yellow-500/20';
        case 'accepted': return 'text-blue-400 border-blue-400/20';
        case 'processing': return 'text-blue-500 border-blue-500/20';
        case 'ready': return 'text-purple-400 border-purple-400/20';
        case 'shipped': return 'text-purple-500 border-purple-500/20';
        case 'completed': return 'text-green-500 border-green-500/20';
        case ORDER_STATUS.REFUNDED: return 'text-orange-400 border-orange-400/20';
        case 'cancelled': return 'text-red-500 border-red-500/20';
        default: return 'text-gray-400';
    }
};

const translateStatus = (status) => {
    switch (status) {
        case ORDER_STATUS.PAYMENT_PENDING: return 'Oczekuje na płatność';
        case 'pending': return 'Oczekujące';
        case 'accepted': return 'Przyjęte';
        case 'processing': return 'W realizacji';
        case 'ready': return 'Gotowe do wysyłki';
        case 'shipped': return 'Wysłane';
        case 'completed': return 'Zakończone';
        case ORDER_STATUS.REFUNDED: return 'Zwrot wykonany';
        case 'cancelled': return 'Anulowane';
        default: return status;
    }
};

export default AdminDashboard;

