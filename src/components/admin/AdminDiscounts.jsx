import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { API_BASE } from '../../utils/config';

const formatDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (part) => String(part).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

const extractErrorMessage = (payload, fallback) => {
    if (!payload) return fallback;
    if (Array.isArray(payload.details) && payload.details.length > 0) {
        const firstDetail = payload.details[0];
        if (firstDetail?.message) {
            return `${payload.error || 'Błąd walidacji'}: ${firstDetail.message}`;
        }
    }
    return payload.error || fallback;
};

const getDefaultFormData = () => ({
    code: '',
    type: 'percent',
    value: '',
    startsAt: formatDateTimeLocal(new Date()),
    expiresAt: '',
    usageLimit: '',
    isActive: true
});

const AdminDiscounts = () => {
    const [discounts, setDiscounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [formData, setFormData] = useState(getDefaultFormData());
    const [modalError, setModalError] = useState('');

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const fetchDiscounts = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/discounts`, { credentials: 'include' });
            if (res.ok) {
                setDiscounts(await res.json());
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setEditingDiscount(null);
        setModalError('');
        setFormData(getDefaultFormData());
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
    };

    const openModal = (discount = null) => {
        setModalError('');

        if (discount) {
            setEditingDiscount(discount);
            setFormData({
                code: discount.code,
                type: discount.type,
                value: String(discount.value),
                startsAt: formatDateTimeLocal(discount.starts_at),
                expiresAt: formatDateTimeLocal(discount.expires_at),
                usageLimit: discount.usage_limit ? String(discount.usage_limit) : '',
                isActive: discount.is_active
            });
        } else {
            resetForm();
        }

        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setModalError('');

        const startsAt = toIsoDateTime(formData.startsAt) || new Date().toISOString();
        const expiresAt = toIsoDateTime(formData.expiresAt);

        if (expiresAt && new Date(expiresAt) <= new Date(startsAt)) {
            setModalError('Data zakończenia musi być późniejsza niż data startu.');
            return;
        }

        const payload = {
            code: formData.code.trim().toUpperCase(),
            type: formData.type,
            value: parseInt(formData.value, 10),
            startsAt,
            expiresAt,
            usageLimit: formData.usageLimit ? parseInt(formData.usageLimit, 10) : null,
            isActive: formData.isActive
        };

        if (!payload.code || Number.isNaN(payload.value)) {
            setModalError('Uzupełnij poprawnie kod i wartość rabatu.');
            return;
        }

        const url = editingDiscount
            ? `${API_BASE}/api/admin/discounts/${editingDiscount.id}`
            : `${API_BASE}/api/admin/discounts`;

        const method = editingDiscount ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errorPayload = await res.json().catch(() => ({}));
                setModalError(extractErrorMessage(errorPayload, 'Nie udało się zapisać kodu rabatowego.'));
                return;
            }

            await fetchDiscounts();
            closeModal();
        } catch (error) {
            console.error(error);
            setModalError('Nie udało się zapisać kodu rabatowego.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Czy na pewno chcesz usunąć ten kod rabatowy?')) return;

        try {
            await fetch(`${API_BASE}/api/admin/discounts/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            setDiscounts((prev) => prev.filter((discount) => discount.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    if (isLoading) {
        return <div className="text-sm text-gray-400">Ładowanie kodów rabatowych...</div>;
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Kody rabatowe</h2>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black transition-colors hover:bg-white"
                >
                    <Plus size={16} />
                    Dodaj kod
                </button>
            </div>

            <div className="glass overflow-hidden rounded-2xl border border-white/5">
                <table className="w-full text-left">
                    <thead className="bg-white/5 text-xs uppercase tracking-wider text-gray-400">
                        <tr>
                            <th className="p-4">Kod</th>
                            <th className="p-4">Wartość</th>
                            <th className="p-4">Użycia</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {discounts.map((discount) => (
                            <tr key={discount.id} className="transition-colors hover:bg-white/5">
                                <td className="p-4 font-mono font-bold text-primary">{discount.code}</td>
                                <td className="p-4">
                                    {discount.type === 'percent'
                                        ? `${discount.value}%`
                                        : `${(discount.value / 100).toFixed(2)} zł`}
                                </td>
                                <td className="p-4 text-sm text-gray-400">
                                    {discount.usage_count} / {discount.usage_limit || '∞'}
                                </td>
                                <td className="p-4">
                                    <span
                                        className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${
                                            discount.is_active
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-red-500/20 text-red-400'
                                        }`}
                                    >
                                        {discount.is_active ? 'Aktywny' : 'Nieaktywny'}
                                    </span>
                                </td>
                                <td className="space-x-2 p-4 text-right">
                                    <button
                                        onClick={() => openModal(discount)}
                                        className="text-gray-400 transition-colors hover:text-white"
                                        aria-label={`Edytuj kod ${discount.code}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(discount.id)}
                                        className="text-red-500 transition-colors hover:text-red-400"
                                        aria-label={`Usuń kod ${discount.code}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 shadow-2xl"
                        >
                            <h3 className="mb-6 text-xl font-bold">
                                {editingDiscount ? 'Edytuj kod rabatowy' : 'Nowy kod rabatowy'}
                            </h3>

                            {modalError && (
                                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                    {modalError}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Kod</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary"
                                        placeholder="np. START10"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Typ</label>
                                        <select
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary"
                                        >
                                            <option value="percent">Procent (%)</option>
                                            <option value="fixed">Kwota (w groszach)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Wartość</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.value}
                                            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Start</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.startsAt}
                                            onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300 outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Koniec</label>
                                        <input
                                            type="datetime-local"
                                            value={formData.expiresAt}
                                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                            className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-sm text-gray-300 outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Limit użyć</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.usageLimit}
                                        onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                        className="w-full rounded-lg border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-primary"
                                        placeholder="np. 100"
                                    />
                                </div>

                                <label className="flex items-center gap-3 py-2 text-sm text-white">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="h-5 w-5 rounded border-gray-600 text-primary focus:ring-primary"
                                    />
                                    Aktywny
                                </label>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 rounded-lg bg-white/10 py-3 font-bold text-white hover:bg-white/20"
                                    >
                                        Anuluj
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 rounded-lg bg-primary py-3 font-bold text-black shadow-lg shadow-primary/20 transition-all hover:bg-white hover:text-black"
                                    >
                                        Zapisz
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminDiscounts;
