import { supabaseAdmin } from '../lib/supabase';
import * as fs from 'fs';
import * as path from 'path';

const BUCKET_NAME = 'product-images';
const METADATA_PATH = path.join(__dirname, 'data', 'images-metadata.json');

async function uploadFile(localPath: string, storagePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  
  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: 'image/png',
      upsert: true
    });

  if (error) {
    // If it's duplicate or error, log and check if we can still get public URL
    console.warn(`Upload warning for ${storagePath}: ${error.message}`);
  } else {
    console.log(`Uploaded: ${storagePath}`);
  }

  // Get Public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return publicUrl;
}

async function run() {
  console.log('--- Starting Storage Upload Pipeline ---');

  if (!fs.existsSync(METADATA_PATH)) {
    console.error(`Metadata file not found at ${METADATA_PATH}`);
    process.exit(1);
  }

  const metadata = JSON.parse(fs.readFileSync(METADATA_PATH, 'utf8'));
  const categoryImages = metadata.categoryImages || {};
  const productImagesMap = metadata.productImagesMap || {};

  const updatedCategoryUrls: Record<string, string> = {};
  const updatedProductImagesMap: Record<string, any[]> = {};

  // 1. Upload Category Images
  console.log('Uploading category images...');
  for (const catSlug of Object.keys(categoryImages)) {
    const relPath = categoryImages[catSlug];
    const localPath = path.join(__dirname, 'data_images', relPath);
    
    if (fs.existsSync(localPath)) {
      const publicUrl = await uploadFile(localPath, relPath);
      updatedCategoryUrls[catSlug] = publicUrl;
    } else {
      console.error(`Category image not found: ${localPath}`);
    }
  }

  // 2. Upload Product Images
  console.log('Uploading product and variant images...');
  for (const prodSlug of Object.keys(productImagesMap)) {
    updatedProductImagesMap[prodSlug] = [];
    const imageList = productImagesMap[prodSlug];

    for (const img of imageList) {
      const localPath = img.absPath;
      const relPath = img.relPath;

      if (fs.existsSync(localPath)) {
        const publicUrl = await uploadFile(localPath, relPath);
        updatedProductImagesMap[prodSlug].push({
          ...img,
          publicUrl
        });
      } else {
        console.error(`Product image not found: ${localPath}`);
      }
    }
  }

  // Save the updated metadata with public URL references
  fs.writeFileSync(
    path.join(__dirname, 'data', 'uploaded-images-metadata.json'),
    JSON.stringify({
      categoryUrls: updatedCategoryUrls,
      productImagesMap: updatedProductImagesMap
    }, null, 2)
  );

  console.log('Storage upload complete! Uploaded metadata saved to data/uploaded-images-metadata.json.');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error during storage upload:', err);
  process.exit(1);
});
