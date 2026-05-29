import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { API_BASE } from '../utils/config';

const ProductModal = ({ isOpen, onClose, onSubmit, editingProduct, categories }) => {
    // Destructure errors from formState
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: { imageUrls: [] }
    });
    const [uploading, setUploading] = React.useState(false);

    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        const newUrls = [];

        try {
            // Upload each file one by one
            for (let i = 0; i < files.length; i++) {
                const formData = new FormData();
                formData.append('image', files[i]);

                // FIXED: Use API_BASE instead of undefined apiBase
                const res = await fetch(`${API_BASE}/api/upload`, {
                    method: 'POST',
                    credentials: 'include', // COOKIE AUTH
                    body: formData
                });

                if (res.ok) {
                    const data = await res.json();
                    newUrls.push(data.url);
                }
            }

            // Append to existing
            const current = watch('imageUrls') || [];
            setValue('imageUrls', [...current, ...newUrls]);

        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    useEffect(() => {
        if (editingProduct) {
            setValue('name', editingProduct.name);
            setValue('price', editingProduct.price);
            setValue('stock', editingProduct.stock);
            setValue('description', editingProduct.description);
            setValue('categoryId', editingProduct.category_id);
            setValue('imageUrls', editingProduct.image_urls || []);
            setValue('species', editingProduct.species || '');
        } else {
            reset({ imageUrls: [] });
        }
    }, [editingProduct, isOpen, reset, setValue]);

    if (!isOpen) return null;

    const onFormSubmit = (data) => {
        const payload = {
            ...data,
            price: parseFloat(data.price),
            stock: parseInt(data.stock),
            imageUrls: data.imageUrls || [] // Use array from form
        };
        onSubmit(payload);
    };

    // Log validation errors
    const onError = (errors) => {
        console.error('Validation Failed:', errors);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold">{editingProduct ? 'Edytuj Produkt' : 'Dodaj Nowy Produkt'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors" aria-label="Zamknij okno produktu" type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit, onError)} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Nazwa Produktu</label>
                            <input {...register('name', { required: "Nazwa jest wymagana" })} className={`w-full bg-black/50 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 outline-none focus:border-primary/50`} />
                            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Gatunek (Łacina)</label>
                            <input {...register('species')} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-primary/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Cena (zł)</label>
                            <input
                                type="number"
                                step="0.01"
                                {...register('price', {
                                    required: "Cena jest wymagana",
                                    min: { value: 0.01, message: "Musi być > 0" },
                                    pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Zły format" }
                                })}
                                className={`w-full bg-black/50 border ${errors.price ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 outline-none focus:border-primary/50`}
                                onKeyDown={(e) => {
                                    if (!/[0-9]|\.|Backspace|Tab|Enter|Arrow|Delete/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            {errors.price && <span className="text-red-500 text-xs">{errors.price.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Stan Magazynowy</label>
                            <input
                                type="number"
                                {...register('stock', {
                                    required: "Stan jest wymagany",
                                    min: { value: 0, message: "Musi być >= 0" },
                                    pattern: { value: /^\d+$/, message: "Tylko liczby całk." }
                                })}
                                className={`w-full bg-black/50 border ${errors.stock ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 outline-none focus:border-primary/50`}
                                onKeyDown={(e) => {
                                    if (!/[0-9]|Backspace|Tab|Enter|Arrow|Delete/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            {errors.stock && <span className="text-red-500 text-xs">{errors.stock.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Kategoria</label>
                            <select
                                {...register('categoryId', { required: "Wybierz kategorię" })}
                                className={`w-full bg-black/50 border ${errors.categoryId ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 outline-none focus:border-primary/50`}
                            >
                                <option value="">Wybierz...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.categoryId && <span className="text-red-500 text-xs">{errors.categoryId.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Zdjęcia Produktu (Upload)</label>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileUpload}
                                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-primary/50 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-white transition-all"
                            />
                        </div>
                        {uploading && <p className="text-xs text-yellow-500 animate-pulse">Optymalizacja i przesyłanie...</p>}

                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {/* Watch existing URLs to display thumbnails/list */}
                            {watch('imageUrls')?.map((url, idx) => (
                                <div key={idx} className="relative group aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10">
                                    <img src={url} alt={`Upload ${idx}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const current = watch('imageUrls');
                                            setValue('imageUrls', current.filter((_, i) => i !== idx));
                                        }}
                                        aria-label={`Usuń zdjęcie numer ${idx + 1}`}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Opis Produktu</label>
                        <textarea {...register('description')} rows={4} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-primary/50 resize-none"></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg hover:bg-white/5 transition-colors">Anuluj</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors">
                            {editingProduct ? 'Zapisz Zmiany' : 'Utwórz Produkt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
