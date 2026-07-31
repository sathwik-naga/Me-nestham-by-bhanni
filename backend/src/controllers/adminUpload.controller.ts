import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

const BUCKET_NAME = 'product-images';

export class AdminUploadController {
  /**
   * POST /api/admin/upload-image
   * Uploads an image file to Supabase Storage using Service Role Key
   */
  public uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        throw new AppError('No image file provided for upload', 400);
      }

      const { productId, variantId, tempFolderId } = req.body;

      // Clean and generate unique filename
      const cleanName = file.originalname
        .split('.')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .substring(0, 30);
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      
      const ext = file.originalname.split('.').pop()?.toLowerCase() || 'webp';
      const fileName = `${cleanName}-${timestamp}-${randomSuffix}.${ext}`;

      // Hierarchy: variants/{variantId}/{fileName} OR {productId}/{fileName} OR temp/{tempFolderId}/{fileName}
      let storagePath = '';
      if (variantId && variantId !== 'null' && variantId !== 'undefined') {
        storagePath = `variants/${variantId}/${fileName}`;
      } else if (productId && productId !== 'null' && productId !== 'undefined') {
        storagePath = `${productId}/${fileName}`;
      } else if (tempFolderId && tempFolderId !== 'null' && tempFolderId !== 'undefined') {
        storagePath = `temp/${tempFolderId}/${fileName}`;
      } else {
        storagePath = `uncategorized/${fileName}`;
      }

      logger.info(`Uploading image via backend to Supabase Storage: ${storagePath}`);

      // Upload file buffer to Supabase Storage via Service Role Client (bypasses RLS)
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || 'image/webp',
          cacheControl: '3600',
          upsert: true,
        });

      if (error) {
        logger.error(`Supabase Storage Backend Upload Error: ${error.message}`);
        throw new AppError(`Storage upload failed: ${error.message}`, 500);
      }

      // Generate Public URL
      const { data: publicUrlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      if (!publicUrlData?.publicUrl) {
        throw new AppError('Failed to generate public URL for uploaded image', 500);
      }

      res.status(200).json({
        status: 'success',
        message: 'Image uploaded successfully to Supabase Storage',
        data: {
          publicUrl: publicUrlData.publicUrl,
          storagePath: storagePath,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /api/admin/delete-image OR POST /api/admin/delete-image
   * Deletes an image file from Supabase Storage using Service Role Key
   */
  public deleteImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { imageUrl, storagePath: rawStoragePath } = req.body;
      let targetPath = rawStoragePath;

      if (!targetPath && imageUrl) {
        // Extract relative storage path from public URL
        try {
          const parsed = new URL(imageUrl);
          if (parsed.pathname.includes(`/object/public/${BUCKET_NAME}/`)) {
            targetPath = parsed.pathname.split(`/object/public/${BUCKET_NAME}/`)[1];
          } else if (parsed.pathname.includes('/object/public/products/')) {
            targetPath = parsed.pathname.split('/object/public/products/')[1];
          }
        } catch (e) {
          logger.warn(`Failed to parse imageUrl: ${imageUrl}`);
        }
      }

      if (!targetPath) {
        res.status(200).json({
          status: 'success',
          message: 'No valid storage path found for deletion, skipping.',
        });
        return;
      }

      logger.info(`Deleting image from Supabase Storage via backend: ${targetPath}`);

      const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([targetPath]);

      if (error) {
        logger.warn(`Supabase Storage Backend Deletion Warning: ${error.message}`);
      }

      res.status(200).json({
        status: 'success',
        message: 'Image deleted successfully from Supabase Storage',
      });
    } catch (error) {
      next(error);
    }
  };
}
