import sharp from 'sharp';

export const processImage = async (input) => {
    try {
        // Keep uploads in memory and cap source complexity to reduce abuse potential.
        const pipeline = sharp(input, {
            failOn: 'error',
            limitInputPixels: 40_000_000
        });

        const buffer = await pipeline
            .rotate()
            .resize({ width: 800, withoutEnlargement: true }) // Reasonable web size
            .webp({ quality: 80 })
            .toBuffer();

        const base64 = buffer.toString('base64');
        return `data:image/webp;base64,${base64}`;
    } catch (error) {
        const invalidImageError = new Error('Invalid image file');
        invalidImageError.statusCode = 400;
        invalidImageError.cause = error;
        throw invalidImageError;
    }
};
