const beginnerCategories = new Set([
    'Jaszczurki i gekony',
    'Węże',
    'Płazy',
    'Terraria i zestawy',
    'Pokarm i suplementy'
]);

export const getProductBadges = (product) => {
    const badges = [];
    const name = `${product?.name || ''} ${product?.species || ''}`.toLowerCase();
    const category = product?.category_name || '';

    if (beginnerCategories.has(category)) {
        badges.push('Dobry na start');
    }

    if (category === 'Terraria i zestawy') {
        badges.push('Gotowy zestaw');
    }

    if (category === 'Pokarm i suplementy') {
        badges.push('Codzienna baza');
    }

    if (category === 'Ogrzewanie i oświetlenie') {
        badges.push('Kluczowe dla warunków');
    }

    if (name.includes('orzęsiony') || name.includes('rzekotka') || name.includes('drzewołaz')) {
        badges.push('Terrarium pionowe');
    }

    if (name.includes('lamparci') || name.includes('zbożowy') || name.includes('agama')) {
        badges.push('Bestseller');
    }

    return badges.slice(0, 2);
};
