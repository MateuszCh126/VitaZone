import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../public/hero-bg.png');
const outputPath = path.join(__dirname, '../public/hero-bg.webp');

async function optimize() {
    try {
        if (!fs.existsSync(inputPath)) {
            console.error('File not found:', inputPath);
            return;
        }

        await sharp(inputPath)
            .resize(1920) // Resize to max HD width
            .webp({ quality: 80, effort: 6 }) // Convert to WebP with high compression
            .toFile(outputPath);

        console.log('Image converted successfully to hero-bg.webp');

        // Check size difference
        const statsIn = fs.statSync(inputPath);
        const statsOut = fs.statSync(outputPath);

        console.log(`Original Size: ${(statsIn.size / 1024).toFixed(2)} KB`);
        console.log(`Optimized Size: ${(statsOut.size / 1024).toFixed(2)} KB`);
        console.log(`Savings: ${((statsIn.size - statsOut.size) / 1024).toFixed(2)} KB`);

    } catch (error) {
        console.error('Error optimizing image:', error);
    }
}

optimize();
