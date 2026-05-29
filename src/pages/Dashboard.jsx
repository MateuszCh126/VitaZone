import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Package, User, Settings, LogOut, AlertOctagon, Save, ShieldCheck } from 'lucide-react';
import { ORDER_STATUS } from '../../shared/orderStatus.js';

const Dashboard = () => {
    const { user, logout, updateProfile, loading } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');

    // Settings Form State
    const [formData, setFormData] = useState({
        country: user?.country || '',
        city: user?.city || '',
        postalCode: user?.postalCode || '',
        street: user?.street || '',
        houseNumber: user?.houseNumber || '',
        apartmentNumber: user?.apartmentNumber || ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [settingsNotice, setSettingsNotice] = useState({ type: '', message: '' });

    const [orders, setOrders] = useState([]);

    React.useEffect(() => {
        setFormData({
            country: user?.country || '',
            city: user?.city || '',
            postalCode: user?.postalCode || '',
            street: user?.street || '',
            houseNumber: user?.houseNumber || '',
            apartmentNumber: user?.apartmentNumber || ''
        });
    }, [user]);

    React.useEffect(() => {
        if (user) {
            const fetchOrders = async () => {
                try {
                    const apiBase = API_BASE;
                    const res = await fetch(`${apiBase}/api/orders/user/${user.id}`, {
                        credentials: 'include'
                    });
                    if (res.ok) {
                        const userOrders = await res.json();
                        setOrders(userOrders);
                    }
                } catch (error) {
                    console.error('Failed to fetch orders', error);
                }
            };
            fetchOrders();
        }
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSettingsNotice({ type: '', message: '' });
        try {
            await updateProfile(formData);
            setSettingsNotice({ type: 'success', message: 'Ustawienia zostały zapisane.' });
        } catch (error) {
            console.error('Failed to save settings', error);
            setSettingsNotice({
                type: 'error',
                message: error.message || 'Nie udało się zapisać ustawień.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            [ORDER_STATUS.PAYMENT_PENDING]: 'Oczekiwanie na płatność',
            pending: 'Oczekujące',
            accepted: 'Zaakceptowane',
            processing: 'W realizacji',
            ready: 'Gotowe',
            shipped: 'Wysłane',
            delivered: 'Dostarczone',
            completed: 'Zakończone',
            cancelled: 'Anulowane',
            [ORDER_STATUS.REFUNDED]: 'Zwrot wykonany'
        };
        return labels[status] || status;
    };

    const handleReturnOrder = (orderId) => {
        const subject = `Zwrot zamówienia #${orderId}`;
        const body = `Dzień dobry,\n\nChciałbym zgłosić zwrot zamówienia #${orderId}.\n\nPowód zwrotu:\n\nPreferowana forma zwrotu środków:\n`;
        window.location.href = `mailto:kontakt@animalsshop.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleReportIssue = (orderId) => {
        const subject = `Zgłoszenie problemu - zamówienie #${orderId}`;
        const body = `Dzień dobry,\n\nChciałbym zgłosić problem z zamówieniem #${orderId}.\n\nOpis problemu:\n`;
        window.location.href = `mailto:kontakt@animalsshop.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleCancelOrder = async (orderId) => {
        if (!confirm('Czy na pewno chcesz anulować to zamówienie?')) return;
        try {
            const apiBase = API_BASE;
            const res = await fetch(`${apiBase}/api/orders/${orderId}/cancel`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (res.ok) {
                setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
            } else {
                const data = await res.json();
                alert(data.error || 'Nie udało się anulować zamówienia');
            }
        } catch (error) {
            console.error('Cancel failed', error);
            alert('Wystąpił błąd podczas anulowania');
        }
    };

    React.useEffect(() => {
        if (!loading && !user) {
            navigate('/login', { replace: true });
        }
    }, [loading, navigate, user]);

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center">Ładowanie konta...</div>;
    }

    if (!user) return null;

    return (
        <div className="container mx-auto px-6 py-12 min-h-screen">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="md:w-1/4">
                    <div className="glass p-6 rounded-2xl sticky top-24 border border-white/5">
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center text-primary text-3xl font-bold mb-4 border border-primary/50">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <h2 className="text-lg font-bold">{user.name}</h2>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>

                        <nav className="space-y-1">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white'}`}
                            >
                                <User size={18} /> Przegląd
                            </button>
                            <button
                                onClick={() => setActiveTab('orders')}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Package size={18} /> Moje zamówienia
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${activeTab === 'settings' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Settings size={18} /> Ustawienia
                            </button>

                            {user.role === 'admin' && (
                                <Link
                                    to="/admin"
                                    className="w-full flex items-center gap-3 p-3 rounded-lg text-green-500 hover:bg-green-500/10 transition-colors"
                                >
                                    <ShieldCheck size={18} /> Panel Admina
                                </Link>
                            )}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-colors mt-8"
                            >
                                <LogOut size={18} /> Wyloguj
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                    <AnimatePresence mode='wait'>
                        {activeTab === 'overview' && (
                            <motion.div
                                key="overview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <h1 className="text-3xl font-bold mb-6">Twoje konto</h1>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="glass p-6 rounded-xl border border-white/5">
                                        <div className="text-gray-400 text-sm mb-1">Liczba zamówień</div>
                                        <div className="text-3xl font-bold">{orders.length}</div>
                                    </div>
                                    <div className="glass p-6 rounded-xl border border-white/5">
                                        <div className="text-gray-400 text-sm mb-1">Data założenia konta</div>
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString('pl-PL') : 'Dzisiaj'}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'orders' && (
                            <motion.div
                                key="orders"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <h2 className="text-2xl font-bold mb-6">Historia zamówień</h2>
                                {orders.map((order) => (
                                    <div key={order.id} className="glass p-6 rounded-xl border border-white/5 flex flex-col gap-4">
                                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Zamówienie #{order.id.slice(0, 8)}</p>
                                                <p className="text-sm font-bold text-gray-300">
                                                    {new Date(order.created_at).toLocaleDateString('pl-PL', {
                                                        year: 'numeric', month: 'long', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${order.status === 'delivered' || order.status === 'completed' || order.status === 'shipped' ? 'bg-green-500/20 text-green-500' :
                                                order.status === ORDER_STATUS.PAYMENT_PENDING ? 'bg-yellow-500/20 text-yellow-400' :
                                                    order.status === ORDER_STATUS.REFUNDED ? 'bg-orange-500/20 text-orange-400' :
                                                order.status === 'cancelled' ? 'bg-red-500/20 text-red-500' :
                                                    'bg-blue-500/20 text-blue-500'
                                                }`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            {Array.isArray(order.items) && order.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-300">
                                                        <span className="text-primary font-bold">{item.quantity}x</span> {item.name || 'Produkt'}
                                                    </span>
                                                    <span className="text-gray-500">{(item.price * item.quantity).toFixed(2)} zł</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-2">
                                            <div>
                                                <span className="text-gray-400 text-xs uppercase">Suma</span>
                                                <p className="text-xl font-bold text-primary">{parseFloat(order.total_amount).toFixed(2)} zł</p>
                                            </div>

                                            <div className="flex gap-3">
                                                {(order.status === 'pending' || order.status === 'accepted') && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-red-500/20"
                                                    >
                                                        Anuluj
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleReturnOrder(order.id)}
                                                    className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-white/10 hover:bg-white/5"
                                                >
                                                    Zwróć
                                                </button>
                                                <button
                                                    onClick={() => handleReportIssue(order.id)}
                                                    className="text-gray-400 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors border border-white/10 hover:bg-white/5"
                                                >
                                                    Zgłoś problem
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <h2 className="text-2xl font-bold mb-6">Ustawienia Konta</h2>
                                <form onSubmit={handleSaveSettings} className="glass p-8 rounded-xl border border-white/5 max-w-2xl">
                                    {settingsNotice.message && (
                                        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
                                            settingsNotice.type === 'success'
                                                ? 'border-green-500/30 bg-green-500/10 text-green-200'
                                                : 'border-red-500/30 bg-red-500/10 text-red-200'
                                        }`}>
                                            {settingsNotice.message}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Kraj</label>
                                            <input
                                                value={formData.country}
                                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-all"
                                                placeholder="np. Polska"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Miasto</label>
                                            <input
                                                value={formData.city}
                                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-all"
                                                placeholder="np. Warszawa"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Kod Pocztowy</label>
                                            <input
                                                value={formData.postalCode}
                                                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-all"
                                                placeholder="00-001"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Ulica</label>
                                            <input
                                                value={formData.street}
                                                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-all"
                                                placeholder="ul. Marszałkowska"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Numer domu</label>
                                            <input
                                                value={formData.houseNumber}
                                                onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-all"
                                                placeholder="10"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Numer lokalu (opcjonalnie)</label>
                                            <input
                                                value={formData.apartmentNumber}
                                                onChange={(e) => setFormData({ ...formData, apartmentNumber: e.target.value })}
                                                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none transition-all"
                                                placeholder="np. 5"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-primary text-black font-bold py-3 px-8 rounded-xl hover:bg-white transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSaving ? 'Zapisywanie...' : <><Save size={18} /> Zapisz Ustawienia</>}
                                    </button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
