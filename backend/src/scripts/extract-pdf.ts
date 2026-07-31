import { Jimp } from 'jimp';
import * as fs from 'fs';
import * as path from 'path';
import { CATEGORIES, PRODUCTS } from './catalog-definition';

const PDF_PATH = 'C:\\Users\\Sathwik\\.gemini\\antigravity-ide\\brain\\6db4c75b-6cb4-4f9f-8bf2-2c74f585e333\\media__1784918649371.pdf';
const PAGES_DIR = path.join(__dirname, 'temp_pages');
const OUTPUT_DIR = path.join(__dirname, 'data_images');

interface ImageMetadata {
  relPath: string;
  absPath: string;
  width: number;
  height: number;
  mimeType: string;
  fileSize: number;
  isFeatured: boolean;
  position: number;
  altText: string;
  label: string;
}

async function renderPdfPages() {
  const { pdf } = await import('pdf-to-img');
  console.log('Rendering PDF pages to PNG...');
  if (!fs.existsSync(PAGES_DIR)) {
    fs.mkdirSync(PAGES_DIR, { recursive: true });
  }

  const document = await pdf(PDF_PATH, { scale: 2 });
  let counter = 1;
  for await (const pageBuffer of document) {
    const pagePath = path.join(PAGES_DIR, `page_${counter}.png`);
    fs.writeFileSync(pagePath, pageBuffer);
    console.log(`Rendered page ${counter}`);
    counter++;
  }
  return counter - 1;
}

async function optimizeAndSave(
  sourcePagePath: string,
  destPath: string,
  crop: { x: number; y: number; w: number; h: number }
) {
  // Ensure destination directory exists
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Load page image with Jimp
  const image = await Jimp.read(sourcePagePath);
  
  // Crop the image
  image.crop({ x: crop.x, y: crop.y, w: crop.w, h: crop.h });
  
  // Resize if the longest side exceeds 1200px
  const maxDim = Math.max(image.width, image.height);
  if (maxDim > 1200) {
    let newW = image.width;
    let newH = image.height;
    if (image.width > image.height) {
      newW = 1200;
      newH = Math.round((1200 * image.height) / image.width);
    } else {
      newH = 1200;
      newW = Math.round((1200 * image.width) / image.height);
    }
    image.resize({ w: newW, h: newH });
  }

  // Write image (Jimp saves as PNG if filename ends with .png, and compresses)
  await image.write(destPath as any);
  
  // Get image details
  const stats = fs.statSync(destPath);
  return {
    width: image.width,
    height: image.height,
    fileSize: stats.size
  };
}

async function main() {
  const pageCount = await renderPdfPages();
  console.log(`Finished rendering ${pageCount} pages.`);

  console.log('Creating cropped images for categories and products...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const categoryImages: Record<string, string> = {};
  const productImagesMap: Record<string, ImageMetadata[]> = {};

  // 1. Process category thumbnails
  for (const cat of CATEGORIES) {
    if (cat.imageCrop) {
      const pagePath = path.join(PAGES_DIR, `page_${cat.imageCrop.page}.png`);
      const destFilename = `${cat.slug}.png`;
      const destPath = path.join(OUTPUT_DIR, 'categories', destFilename);
      
      console.log(`Cropping category thumbnail for ${cat.name}...`);
      await optimizeAndSave(pagePath, destPath, {
        x: cat.imageCrop.x,
        y: cat.imageCrop.y,
        w: cat.imageCrop.w,
        h: cat.imageCrop.h
      });
      categoryImages[cat.slug] = `categories/${destFilename}`;
    }
  }

  // 2. Process product main and gallery crops
  for (const prod of PRODUCTS) {
    productImagesMap[prod.slug] = [];
    
    for (let idx = 0; idx < prod.crops.length; idx++) {
      const crop = prod.crops[idx];
      const pagePath = path.join(PAGES_DIR, `page_${crop.page}.png`);
      
      // Clean name for image file
      const cleanLabel = crop.label ? crop.label.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'image';
      const destFilename = `${prod.slug}-${cleanLabel}.png`;
      const destPath = path.join(OUTPUT_DIR, 'products', prod.categorySlug, destFilename);
      
      console.log(`Cropping image for product ${prod.name} (${cleanLabel})...`);
      const details = await optimizeAndSave(pagePath, destPath, {
        x: crop.x,
        y: crop.y,
        w: crop.w,
        h: crop.h
      });

      // Compute Alt Text
      let altText = prod.name;
      if (crop.label && crop.label !== 'main' && crop.label !== 'collage') {
        const capitalizedLabel = crop.label.charAt(0).toUpperCase() + crop.label.slice(1);
        altText = `${prod.name} - ${capitalizedLabel}`;
      }

      productImagesMap[prod.slug].push({
        relPath: `products/${prod.categorySlug}/${destFilename}`,
        absPath: destPath,
        width: details.width,
        height: details.height,
        mimeType: 'image/png',
        fileSize: details.fileSize,
        isFeatured: crop.isFeatured === true || idx === 0,
        position: idx,
        altText: altText,
        label: crop.label || ''
      });
    }
  }

  // Save the mapping metadata to files for Phase 3 ingestion
  fs.writeFileSync(
    path.join(__dirname, 'data', 'images-metadata.json'),
    JSON.stringify({ categoryImages, productImagesMap }, null, 2)
  );
  
  console.log('Image extraction and cropping completed! Metadata saved to data/images-metadata.json.');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during image extraction:', err);
  process.exit(1);
});
