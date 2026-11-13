export const sortProducts = (products, sortBy = 'catalog') => {
  const items = [...products];
  if (sortBy === 'price-asc') return items.sort((a, b) => Number(a.price) - Number(b.price));
  if (sortBy === 'price-desc') return items.sort((a, b) => Number(b.price) - Number(a.price));
  if (sortBy === 'newest') return items.sort((a, b) => Date.parse(b.created_at || '') - Date.parse(a.created_at || ''));
  return items;
};
