export const getPolishPlural = (count, forms) => {
    // forms example: ['wynik', 'wyniki', 'wynikow']
    const num = Math.abs(count);
    if (num === 1) return forms[0];
    const mod10 = num % 10;
    const mod100 = num % 100;

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
        return forms[1];
    }
    return forms[2];
};
