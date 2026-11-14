const toPublicImageUrl = (imageUrl, imageBaseUrl) => {
  if (typeof imageUrl !== 'string' || !imageUrl.trim()) return null;

  try {
    const url = new URL(imageUrl, imageBaseUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
};

export const buildProductSchema = (product, { canonicalUrl, imageBaseUrl }) => {
  if (!product || typeof product.name !== 'string' || !product.name.trim() || !canonicalUrl) return null;

  const images = (Array.isArray(product.image_urls) ? product.image_urls : [])
    .map((imageUrl) => toPublicImageUrl(imageUrl, imageBaseUrl))
    .filter(Boolean);
  const priceCents = product.price_cents;
  const hasPrice = typeof priceCents === 'number'
    && Number.isSafeInteger(priceCents)
    && priceCents > 0;

  if (!images.length || !hasPrice) return null;

  const offer = {
    '@type': 'Offer',
    url: canonicalUrl,
    priceCurrency: 'PLN',
    price: (priceCents / 100).toFixed(2)
  };
  const stock = product.stock;
  if (typeof stock === 'number' && Number.isSafeInteger(stock) && stock >= 0) {
    offer.availability = stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  }

  return {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: images,
    ...(typeof product.description === 'string' && product.description.trim()
      ? { description: product.description }
      : {}),
    offers: offer
  };
};
