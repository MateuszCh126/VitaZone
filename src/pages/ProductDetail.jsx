import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, ShoppingBag, Truck } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { API_BASE } from '../utils/config';
import { useCart } from '../context/CartContext';
import { getOptimizedImageUrl, getSrcSet } from '../utils/imageUtils';
import { getProductBadges } from '../utils/productBadges';
import { trackEvent } from '../utils/analytics';

const liveAnimalCategories = new Set([
  'Jaszczurki i gekony',
  'Węże',
  'Żółwie',
  'Płazy',
  'Ptaszniki i skorpiony'
]);

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/products/${id}`);
        if (response.ok) {
          const data = await response.json();
          setProduct(data);
          trackEvent('view_product', {
            productId: data.id,
            name: data.name,
            category: data.category_name,
            price: Number(data.price) || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);

  const isLiveAnimal = useMemo(() => liveAnimalCategories.has(product?.category_name), [product?.category_name]);
  const productBadges = useMemo(() => getProductBadges(product), [product]);

  const nextImage = () => {
    if (!product?.image_urls?.length) return;
    setCurrentImageIndex((previous) => (previous === product.image_urls.length - 1 ? 0 : previous + 1));
  };

  const previousImage = () => {
    if (!product?.image_urls?.length) return;
    setCurrentImageIndex((previous) => (previous === 0 ? product.image_urls.length - 1 : previous - 1));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-center sm:px-6">
        <div className="text-xl font-mono text-gray-500">Ładowanie produktu...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center sm:px-6">
        <h2 className="mb-4 text-3xl font-bold">Nie znaleźliśmy tego produktu</h2>
        <Link to="/shop" className="text-primary hover:underline">
          Wróć do asortymentu
        </Link>
      </div>
    );
  }

  const imageUrls = product.image_urls?.length ? product.image_urls : ['/hero-bg.webp'];
  const currentImage = imageUrls[currentImageIndex];

  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: imageUrls[0],
    description: product.description,
    sku: product.id,
    offers: {
      '@type': 'Offer',
      url: window.location.href,
      priceCurrency: 'PLN',
      price: product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 sm:py-12">
      <Helmet>
        <title>{`${product.name} | ${product.category_name} | VitaZone`}</title>
        <meta name="description" content={product.description?.substring(0, 160)} />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <Link to="/shop" className="mb-6 inline-flex items-center gap-2 text-gray-400 transition-colors hover:text-white sm:mb-8">
        <ArrowLeft size={20} /> Powrót do asortymentu
      </Link>

      <div className="grid grid-cols-1 gap-8 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="group relative h-[340px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-bg-secondary shadow-2xl sm:h-[420px] sm:rounded-[2rem] lg:h-[520px]">
            <img
              src={getOptimizedImageUrl(currentImage, 1400)}
              srcSet={getSrcSet(currentImage)}
              sizes="(max-width: 1024px) 100vw, 55vw"
              alt={`${product.name} - zdjęcie ${currentImageIndex + 1}`}
              width="1400"
              height="1050"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />

            {imageUrls.length > 1 && (
              <>
                <button
                  onClick={previousImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white opacity-100 backdrop-blur-sm transition-all hover:bg-primary hover:text-black sm:left-4 sm:p-3 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Poprzednie zdjęcie"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2.5 text-white opacity-100 backdrop-blur-sm transition-all hover:bg-primary hover:text-black sm:right-4 sm:p-3 md:opacity-0 md:group-hover:opacity-100"
                  aria-label="Następne zdjęcie"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
          </div>

          {imageUrls.length > 1 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {imageUrls.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`Pokaż zdjęcie ${index + 1} produktu ${product.name}`}
                  aria-pressed={index === currentImageIndex}
                  type="button"
                  className={`overflow-hidden rounded-2xl border ${
                    index === currentImageIndex ? 'border-primary' : 'border-white/10'
                  }`}
                >
                  <img src={getOptimizedImageUrl(imageUrl, 300)} alt="" className="h-20 w-full object-cover sm:h-24" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">{product.category_name}</p>
          <h1 className="mb-3 text-3xl font-black text-white sm:text-4xl md:text-5xl">{product.name}</h1>
          <p className="mb-4 text-base italic text-gray-400 sm:text-lg">{product.species}</p>

          {productBadges.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {productBadges.map((badge) => (
                <span key={badge} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {badge}
                </span>
              ))}
            </div>
          )}

          <p className="mb-8 text-base leading-relaxed text-gray-300 sm:text-lg">{product.description}</p>

          <div className="mb-8 grid gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Cena</p>
              <p className="mt-2 text-2xl font-bold text-white">{product.price} zł</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Dostępność</p>
              <p className="mt-2 text-2xl font-bold text-white">{product.stock} szt.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-gray-500">Status</p>
              <p className="mt-2 text-base font-semibold text-primary">
                {product.stock > 0 ? 'Gotowe do zamówienia' : 'Chwilowo niedostępne'}
              </p>
            </div>
          </div>

          <button
            onClick={() => addToCart(product)}
            aria-label={`Dodaj produkt ${product.name} do koszyka`}
            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-primary py-4 font-bold text-black transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={product.stock <= 0}
          >
            <ShoppingBag size={20} /> Dodaj do koszyka
          </button>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300">
              <div className="mb-3 flex items-center gap-2 text-white">
                <CheckCircle2 size={18} className="text-primary" />
                Co warto wiedzieć
              </div>
              <p>
                {isLiveAnimal
                  ? 'To żywe zwierzę, dlatego przed zakupem upewnij się, że masz gotowe terrarium, temperaturę, UVB i plan żywienia.'
                  : 'Ten produkt jest częścią wyposażenia i dobrze pracuje w duecie z odpowiednio dobranym terrarium oraz kontrolą temperatury.'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-gray-300">
              <div className="mb-3 flex items-center gap-2 text-white">
                <Truck size={18} className="text-primary" />
                Dostawa
              </div>
              <p>
                {isLiveAnimal
                  ? 'Żywe zwierzęta wysyłamy wyłącznie w bezpiecznych oknach logistycznych. Po zamówieniu potwierdzamy dogodny termin kontaktowo.'
                  : 'Akcesoria, terraria i pokarm wysyłamy standardowo w 24-48 godzin, zależnie od typu produktu i dostępności.'}
              </p>
            </div>
          </div>

          {isLiveAnimal && (
            <div className="mt-6 rounded-2xl border border-orange-500/20 bg-orange-500/10 p-5 text-sm leading-relaxed text-orange-100">
              <strong>Uwaga:</strong> dla żywych zwierząt nie stosuje się standardowego zwrotu jak dla zwykłych akcesoriów.
              Szczegóły znajdziesz w zakładce odstąpienia od umowy i FAQ.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
