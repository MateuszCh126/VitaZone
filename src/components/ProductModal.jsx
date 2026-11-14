import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { X } from 'lucide-react';
import { API_BASE } from '../utils/config';

const ProductModal = ({ isOpen, onClose, onSubmit, editingProduct, categories }) => {
    // Destructure errors from formState
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
        defaultValues: { imageUrls: [] }
    });
    const [uploading, setUploading] = React.useState(false);
    const [specsError, setSpecsError] = React.useState('');
    const dialogRef = useRef(null);
    const openerRef = useRef(null);
    const closeButtonRef = useRef(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

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
            setValue('specsJson', JSON.stringify(editingProduct.specs || {}, null, 2));
        } else {
            reset({ imageUrls: [] });
            setSpecsError('');
        }
    }, [editingProduct, isOpen, reset, setValue]);

    useEffect(() => {
        if (!isOpen) return undefined;

        openerRef.current = document.activeElement;
        const originalBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const dialog = dialogRef.current;
        const initialFocusTarget = dialog?.querySelector('[data-autofocus]') || closeButtonRef.current;
        initialFocusTarget?.focus();

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCloseRef.current();
                return;
            }
            if (event.key !== 'Tab') return;

            const focusable = dialog?.querySelectorAll(
                'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (!focusable?.length) {
                event.preventDefault();
                dialog?.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const activeIndex = Array.prototype.indexOf.call(focusable, document.activeElement);
            if (activeIndex < 0) {
                event.preventDefault();
                (event.shiftKey ? last : first).focus();
            } else if (event.shiftKey && activeIndex === 0) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && activeIndex === focusable.length - 1) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalBodyOverflow;
            if (openerRef.current instanceof HTMLElement && openerRef.current.isConnected) {
                openerRef.current.focus();
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const onFormSubmit = (data) => {
        let specs = {};
        try {
            specs = data.specsJson?.trim() ? JSON.parse(data.specsJson) : {};
            if (!specs || typeof specs !== 'object' || Array.isArray(specs)) {
                throw new Error('JSON musi zawierać obiekt.');
            }
            setSpecsError('');
        } catch {
            setSpecsError('Wpisz poprawny obiekt JSON. Wymiary muszą być rzeczywistymi wymiarami zapakowanego produktu.');
            return;
        }
        const { specsJson: _specsJson, ...formData } = data;
        const payload = {
            ...formData,
            specs,
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div
                ref={dialogRef}
                id="product-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-dialog-title"
                tabIndex={-1}
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1a1a]"
            >
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 id="product-dialog-title" className="text-xl font-bold">{editingProduct ? 'Edytuj produkt' : 'Dodaj produkt'}</h2>
                    <button ref={closeButtonRef} onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors" aria-label="Zamknij okno produktu" type="button">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onFormSubmit, onError)} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="product-name" className="text-sm text-gray-400">Nazwa produktu</label>
                            <input id="product-name" data-autofocus {...register('name', { required: "Nazwa jest wymagana" })} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'product-name-error' : undefined} className={`w-full bg-black/50 border ${errors.name ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 outline-none focus:border-primary/50`} />
                            {errors.name && <span id="product-name-error" className="text-red-400 text-xs">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="product-species" className="text-sm text-gray-400">Gatunek (łacina)</label>
                            <input id="product-species" {...register('species')} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-primary/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label htmlFor="product-price" className="text-sm text-gray-400">Cena (zł)</label>
                            <input
                                id="product-price"
                                type="number"
                                step="0.01"
                                {...register('price', {
                                    required: "Cena jest wymagana",
                                    min: { value: 0.01, message: "Musi być > 0" },
                                    pattern: { value: /^\d+(\.\d{1,2})?$/, message: "Zły format" }
                                })}
                                aria-invalid={Boolean(errors.price)}
                                aria-describedby={errors.price ? 'product-price-error' : undefined}
                                className={`w-full bg-black/50 border ${errors.price ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 outline-none focus:border-primary/50`}
                                onKeyDown={(e) => {
                                    if (!/[0-9]|\.|Backspace|Tab|Enter|Arrow|Delete/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            {errors.price && <span id="product-price-error" className="text-red-400 text-xs">{errors.price.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="product-stock" className="text-sm text-gray-400">Stan magazynowy</label>
                            <input
                                id="product-stock"
                                type="number"
                                {...register('stock', {
                                    required: "Stan jest wymagany",
                                    min: { value: 0, message: "Musi być >= 0" },
                                    pattern: { value: /^\d+$/, message: "Tylko liczby całk." }
                                })}
                                aria-invalid={Boolean(errors.stock)}
                                aria-describedby={errors.stock ? 'product-stock-error' : undefined}
                                className={`w-full bg-black/50 border ${errors.stock ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 outline-none focus:border-primary/50`}
                                onKeyDown={(e) => {
                                    if (!/[0-9]|Backspace|Tab|Enter|Arrow|Delete/.test(e.key)) {
                                        e.preventDefault();
                                    }
                                }}
                            />
                            {errors.stock && <span id="product-stock-error" className="text-red-400 text-xs">{errors.stock.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="product-category" className="text-sm text-gray-400">Kategoria</label>
                            <select
                                id="product-category"
                                {...register('categoryId', { required: "Wybierz kategorię" })}
                                aria-invalid={Boolean(errors.categoryId)}
                                aria-describedby={errors.categoryId ? 'product-category-error' : undefined}
                                className={`w-full bg-black/50 border ${errors.categoryId ? 'border-red-500' : 'border-white/10'} rounded-lg p-3 outline-none focus:border-primary/50`}
                            >
                                <option value="">Wybierz...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {errors.categoryId && <span id="product-category-error" className="text-red-400 text-xs">{errors.categoryId.message}</span>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="product-images" className="text-sm text-gray-400">Zdjęcia produktu</label>
                        <div className="flex gap-2">
                            <input
                                id="product-images"
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
                                    <img src={url} alt={`Podgląd zdjęcia ${idx + 1}`} className="w-full h-full object-cover" />
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
                        <label htmlFor="product-description" className="text-sm text-gray-400">Opis produktu</label>
                        <textarea id="product-description" {...register('description')} rows={4} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 outline-none focus:border-primary/50 resize-none"></textarea>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="product-specs-json" className="text-sm text-gray-400">Specyfikacja produktu i paczki (JSON)</label>
                        <textarea
                            id="product-specs-json"
                            {...register('specsJson')}
                            rows={5}
                            className="w-full rounded-lg border border-white/10 bg-black/50 p-3 font-mono text-xs outline-none focus:border-primary/50"
                            placeholder={'{\n  "shipping_parcels": [{ "width": 30, "depth": 20, "height": 10, "weight": 2 }]\n}'}
                        />
                        <p className="text-xs text-gray-400">Pola wymiarów (cm) i masy (kg) wpisz po spakowaniu produktu. Do wyceny wymagane są width, depth, height i weight.</p>
                        {specsError && <p role="alert" className="text-xs text-red-400">{specsError}</p>}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg hover:bg-white/5 transition-colors">Anuluj</button>
                        <button type="submit" className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors">
                            {editingProduct ? 'Zapisz zmiany' : 'Utwórz produkt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductModal;
