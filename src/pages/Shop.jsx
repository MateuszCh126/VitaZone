import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Filter, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE } from '../utils/config';
import { useCart } from '../context/CartContext';
import { getPolishPlural } from '../utils/grammarUtils';
import { getOptimizedImageUrl, getSrcSet } from '../utils/imageUtils';
import { CATEGORY_ORDER } from '../data/storefrontData';
import { getProductBadges } from '../utils/productBadges';
import { fetchJsonWithRetry } from '../utils/fetchJson';

const categoryRank = new Map(CATEGORY_ORDER.map((name, index) => [name, index]));

const sortCategories = (categories) =>
  categories.sort((left, right) => {
    const leftRank = categoryRank.has(left) ? categoryRank.get(left) : Number.MAX_SAFE_INTEGER;
    const rightRank = categoryRank.has(right) ? categoryRank.get(right) : Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.localeCompare(right, 'pl');
  });

const Shop = () => {
  const [searchParams] = useSearchParams();
  const queryCategory = searchParams.get('category');
  const querySearch = searchParams.get('search');
  const paramToken = `${queryCategory || ''}|${querySearch || ''}`;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['Wszystkie']);
  const [maxPrice, setMaxPrice] = useState(3000);
  const [priceRange, setPriceRange] = useState(3000);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [catalogError, setCatalogError] = useState('');
  const [catalogRequestKey, setCatalogRequestKey] = useState(0);
  const [newProductThreshold] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  const routeFilters = useMemo(
    () => ({
      token: paramToken,
      selectedCategory: queryCategory || 'Wszystkie',
      searchQuery: querySearch || ''
    }),
    [paramToken, queryCategory, querySearch]
  );
  const [localFilters, setLocalFilters] = useState(routeFilters);

  const { addToCart } = useCart();

  const effectiveFilters = localFilters.token === paramToken ? localFilters : routeFilters;
  const selectedCategory = effectiveFilters.selectedCategory;
  const searchQuery = effectiveFilters.searchQuery;

  const handleCategoryChange = (category) => {
    setLocalFilters({
      token: paramToken,
      selectedCategory: category,
      searchQuery
    });
  };

  const handleSearchChange = (value) => {
    setLocalFilters({
      token: paramToken,
      selectedCategory,
      searchQuery: value
    });
  };

  const retryCatalogFetch = () => {
    setCatalogRequestKey((current) => current + 1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productData = await fetchJsonWithRetry(`${API_BASE}/api/products`);

        const safeProducts = Array.isArray(productData) ? productData : [];
        const safeCategoryNames = safeProducts
          .map((product) => product?.category_name)
          .filter(Boolean);

        const highestPrice = safeProducts.length
          ? Math.ceil(Math.max(...safeProducts.map((product) => Number.parseFloat(product.price) || 0)))
          : 3000;

        setProducts(safeProducts);
        setCategories(['Wszystkie', ...sortCategories([...new Set(safeCategoryNames.length ? safeCategoryNames : CATEGORY_ORDER)])]);
        setMaxPrice(highestPrice || 3000);
        setPriceRange(highestPrice || 3000);
        setCatalogError('');
      } catch (error) {
        console.error('Failed to fetch catalog data:', error);
        setProducts([]);
        setCategories(['Wszystkie', ...CATEGORY_ORDER]);
        setCatalogError('Nie udało się chwilowo pobrać pełnej oferty. Spróbuj ponownie za moment.');
      }
    };

    fetchData();
  }, [catalogRequestKey]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = selectedCategory === 'Wszystkie' || product.category_name === selectedCategory;
      const matchesPrice = Number.parseFloat(product.price) <= priceRange;
      const searchable = `${product.name} ${product.species || ''} ${product.description || ''}`.toLowerCase();
      const matchesSearch = searchable.includes(searchQuery.toLowerCase());
      return matchesCategory && matchesPrice && matchesSearch;
    });
  }, [priceRange, products, searchQuery, selectedCategory]);

  const renderFilters = () => (
    <div className="glass sticky top-24 rounded-3xl p-6">
      <div className="mb-8">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <Search size={18} className="text-primary" /> Szukaj
        </h3>
        <input
          type="text"
          placeholder="Szukaj produktu lub gatunku"
          value={searchQuery}
          onChange={(event) => handleSearchChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-base text-white transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="mb-8">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
          <SlidersHorizontal size={18} className="text-primary" /> Kategorie
        </h3>
        <div className="flex flex-col gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`rounded-2xl px-4 py-3 text-left text-sm transition-all ${
                selectedCategory === category
                  ? 'bg-primary font-semibold text-black shadow-glow'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">Budżet</h3>
          <span className="text-sm font-mono text-primary">do {priceRange} zł</span>
        </div>
        <input
          type="range"
          min="0"
          max={maxPrice}
          value={priceRange}
          onChange={(event) => setPriceRange(Number(event.target.value))}
          className="h-6 w-full cursor-pointer appearance-none rounded-lg bg-white/20 accent-primary"
        />
        <div className="mt-2 flex justify-between font-mono text-xs text-gray-500">
          <span>0 zł</span>
          <span>{maxPrice} zł</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-12">
      <Helmet>
        <title>
          {selectedCategory !== 'Wszystkie'
            ? `${selectedCategory} | VitaZone`
            : 'Sklep terrarystyczny VitaZone | Zwierzęta, terraria i akcesoria'}
        </title>
        <meta
          name="description"
          content="Przeglądaj ofertę VitaZone: zwierzęta egzotyczne, terraria oraz akcesoria do kompletnego i bezpiecznego setupu."
        />
      </Helmet>

      <section className="mb-10 rounded-[2rem] border border-white/10 bg-white/[0.03] px-8 py-10 md:px-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-primary/80">Asortyment</p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="mb-3 text-4xl font-extrabold tracking-[-0.03em] text-white md:text-5xl">
              {selectedCategory === 'Wszystkie' ? 'Sklep terrarystyczny VitaZone' : selectedCategory}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-gray-400">
              Zwierzęta egzotyczne, terraria i wyposażenie do gotowych setupów. Filtruj ofertę po kategorii, cenie lub nazwie produktu.
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/8 px-5 py-4 text-sm text-gray-200">
            <span className="font-semibold text-white">{filteredProducts.length}</span>{' '}
            {getPolishPlural(filteredProducts.length, ['produkt', 'produkty', 'produktów'])} po aktywnych filtrach
          </div>
        </div>
      </section>

      <div className="mb-6 md:hidden">
        <button
          className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-white"
          onClick={() => setIsFilterOpen((current) => !current)}
        >
          <Filter size={20} /> {isFilterOpen ? 'Ukryj filtry' : 'Pokaż filtry'}
        </button>
      </div>

      <div className="flex flex-col gap-12 md:flex-row md:items-start">
        <aside className="hidden w-72 flex-shrink-0 md:block">{renderFilters()}</aside>

        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden md:hidden"
            >
              <div className="mb-6">{renderFilters()}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1">
          {catalogError && (
            <div className="mb-6 rounded-3xl border border-amber-500/20 bg-amber-500/10 px-6 py-5 text-sm text-amber-100">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p>Nie udało się pobrać pełnej oferty. Spróbuj ponownie za moment.</p>
                <button
                  type="button"
                  onClick={retryCatalogFetch}
                  className="inline-flex items-center justify-center rounded-full border border-amber-300/30 px-4 py-2 font-semibold text-amber-50 transition-colors hover:bg-amber-200/10"
                >
                  Spróbuj ponownie
                </button>
              </div>
            </div>
          )}

          <div className="mb-6 flex flex-wrap items-center gap-3">
            {categories.slice(0, 6).map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`rounded-full px-4 py-2 text-sm transition-all ${
                  selectedCategory === category
                    ? 'bg-primary text-black'
                    : 'border border-white/10 bg-white/[0.03] text-gray-300 hover:border-primary/40 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  addToCart={addToCart}
                  newProductThreshold={newProductThreshold}
                />
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-16 text-center">
              <h2 className="text-2xl font-bold text-white">
                {catalogError ? 'Oferta chwilowo niedostępna' : 'Brak produktów dla wybranych filtrów'}
              </h2>
              <p className="mt-3 text-gray-400">
                {catalogError
                  ? 'Jeśli problem się powtarza, odśwież stronę lub wróć za chwilę.'
                  : 'Spróbuj poszerzyć budżet, zmienić kategorię albo użyć krótszej frazy wyszukiwania.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({ product, index, addToCart, newProductThreshold }) => {
  const badges = getProductBadges(product);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.22 }}
      className="group overflow-hidden rounded-3xl border border-white/5 bg-bg-secondary transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="relative h-72 overflow-hidden">
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={getOptimizedImageUrl(product.image_urls?.[0], 900)}
            srcSet={getSrcSet(product.image_urls?.[0])}
            sizes="(max-width: 768px) 100vw, 33vw"
            alt={product.name}
            loading={index < 6 ? 'eager' : 'lazy'}
            fetchPriority={index < 6 ? 'high' : 'auto'}
            decoding={index < 6 ? 'sync' : 'async'}
            width="400"
            height="300"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/45" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <div className="flex max-w-[70%] flex-wrap gap-2">
            <span className="rounded-full border border-white/15 bg-black/70 px-3 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-md">
              {product.category_name}
            </span>
            {badges.map((badge) => (
              <span key={badge} className="rounded-full border border-primary/40 bg-black/75 px-3 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md">
                {badge}
              </span>
            ))}
          </div>
          {product.is_active && product.stock > 0 && product.created_at > newProductThreshold && (
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-black">
              NOWOŚĆ
            </span>
          )}
        </div>
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            addToCart(product);
          }}
          aria-label={`Dodaj produkt ${product.name} do koszyka`}
          className="absolute bottom-4 right-4 z-10 translate-y-4 rounded-full bg-white p-3 text-black opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-primary"
        >
          <ShoppingBag size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="p-5">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gray-500">{product.species}</p>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-xl font-bold text-white transition-colors group-hover:text-primary">{product.name}</h3>
        </Link>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-gray-400">{product.description}</p>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-2xl font-bold text-white">{product.price} zł</span>
          <Link to={`/product/${product.id}`} className="text-sm text-gray-400 transition-colors hover:text-white">
            Szczegóły →
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default Shop;
