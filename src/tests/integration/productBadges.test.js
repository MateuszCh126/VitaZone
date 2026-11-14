import { describe, expect, it } from 'vitest';
import { getProductBadges } from '../../utils/productBadges.js';

describe('product merchandising badges', () => {
    it('does not infer popularity or suitability from category and product names', () => {
        expect(getProductBadges({
            name: 'Gekon lamparci',
            species: 'Gekon lamparci',
            category_name: 'Jaszczurki i gekony'
        })).toEqual([]);
    });
});
