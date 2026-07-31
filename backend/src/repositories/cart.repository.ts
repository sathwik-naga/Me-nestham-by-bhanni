import { supabaseAdmin } from '../lib/supabase';
import { Cart, CartItem } from '../interfaces/cart.interface';
import { AppError } from '../middleware/error';
import logger from '../utils/logger';

export class CartRepository {
  /**
   * Helper to format raw product output from database
   */
  private formatJoinedProduct(product: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!product) return null;
    const images = (product.images as { image_url: string; is_featured: boolean }[] | undefined) || [];
    const featured = images.find((img) => img.is_featured);
    const mainImageUrl = product.image_url as string | null;

    return {
      ...product,
      featured_image: mainImageUrl || (featured ? featured.image_url : (images[0]?.image_url || null)),
      gallery_images: [
        ...(mainImageUrl ? [mainImageUrl] : []),
        ...images.map((img) => img.image_url)
      ],
    };
  }

  /**
   * Find user's active cart or create one if missing
   */
  async getOrCreateCart(userId: string): Promise<Cart> {
    try {
      // 1. Try to fetch existing cart
      const { data: existingCart, error: fetchError } = await supabaseAdmin
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // 2. Cart not found, create new cart
          const { data: newCart, error: createError } = await supabaseAdmin
            .from('cart')
            .insert([{ user_id: userId }])
            .select()
            .single();

          if (createError) {
            logger.error(`Database error creating cart for user ID ${userId}: ${createError.message}`);
            throw new AppError('Failed to create shopping cart', 500);
          }

          return { ...newCart, items: [] } as Cart;
        }
        logger.error(`Database error fetching cart for user ID ${userId}: ${fetchError.message}`);
        throw new AppError('Failed to fetch shopping cart', 500);
      }

      return { ...existingCart, items: [] } as Cart;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error getOrCreateCart: ${err}`);
      throw new AppError('Internal server error during cart management', 500);
    }
  }

  /**
   * Fetch all items currently in the cart
   */
  async getCartItems(cartId: string): Promise<CartItem[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .select(
          `
          *,
          product:products(
            *,
            images:product_images(*),
            variants:product_variants(*)
          )
          `
        )
        .eq('cart_id', cartId)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error(`Database error fetching cart items for cart ${cartId}: ${error.message}`);
        throw new AppError('Failed to fetch cart items', 500);
      }

      const rawItems = (data || []) as Array<Record<string, unknown>>;
      
      // Fetch options and images for the variants in bulk
      const variantIds = rawItems.map((item) => item.variant_id).filter(Boolean) as string[];
      let optionsMap: Record<string, any[]> = {};
      let imagesMap: Record<string, any[]> = {};

      if (variantIds.length > 0) {
        try {
          const { data: optionsData } = await supabaseAdmin
            .from('variant_options')
            .select('*')
            .in('variant_id', variantIds);
          if (optionsData) {
            optionsData.forEach((opt: any) => {
              if (!optionsMap[opt.variant_id]) optionsMap[opt.variant_id] = [];
              optionsMap[opt.variant_id].push({
                option_name: opt.option_name,
                option_value: opt.option_value,
              });
            });
          }
        } catch (e) {
          logger.warn(`Failed to fetch variant_options for cart items: ${e}`);
        }

        try {
          const { data: imagesData } = await supabaseAdmin
            .from('variant_images')
            .select('*')
            .in('variant_id', variantIds)
            .order('is_primary', { ascending: false })
            .order('sort_order', { ascending: true });

          if (imagesData) {
            imagesData.forEach((img: any) => {
              if (!imagesMap[img.variant_id]) imagesMap[img.variant_id] = [];

              let publicUrl = img.image_url;
              if (img.storage_path) {
                const { data } = supabaseAdmin.storage
                  .from('product-images')
                  .getPublicUrl(img.storage_path);
                if (data?.publicUrl) publicUrl = data.publicUrl;
              }

              imagesMap[img.variant_id].push({
                id: img.id,
                variant_id: img.variant_id,
                storage_path: img.storage_path || null,
                image_url: publicUrl || '',
                media_type: img.media_type || 'image',
                alt_text: img.alt_text || null,
                sort_order: img.sort_order !== undefined && img.sort_order !== null ? img.sort_order : (img.position || 0),
                is_primary: !!img.is_primary,
                position: img.sort_order !== undefined && img.sort_order !== null ? img.sort_order : (img.position || 0),
              });
            });
          }
        } catch (e) {
          logger.warn(`Failed to fetch variant_images for cart items: ${e}`);
        }
      }

      const formattedItems = rawItems.map((item) => {
        const product = this.formatJoinedProduct(item.product as Record<string, unknown> | null);
        let variant = null;
        if (product && Array.isArray(product.variants) && item.variant_id) {
          variant = product.variants.find((v: any) => v.id === item.variant_id) || null;
          if (variant) {
            variant.stock = variant.stock !== undefined ? variant.stock : (variant.stock_quantity || 0);
            variant.stock_quantity = variant.stock_quantity !== undefined ? variant.stock_quantity : variant.stock;
            
            // Set options
            if (optionsMap[variant.id]) {
              variant.options = optionsMap[variant.id];
            } else if (!variant.options) {
              const fallbackOptions = [];
              if (variant.size) fallbackOptions.push({ option_name: 'Size', option_value: variant.size });
              if (variant.color) fallbackOptions.push({ option_name: 'Color', option_value: variant.color });
              if (variant.material) fallbackOptions.push({ option_name: 'Material', option_value: variant.material });
              variant.options = fallbackOptions;
            }

            // Set images
            if (imagesMap[variant.id]) {
              variant.images = imagesMap[variant.id];
            } else if (!variant.images) {
              variant.images = [];
            }
          }
        }
        return {
          ...item,
          product,
          variant,
        };
      }) as unknown as CartItem[];

      return formattedItems;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error getCartItems: ${err}`);
      throw new AppError('Internal server error during cart retrieval', 500);
    }
  }

  /**
   * Find single cart item by cart ID, product ID and optional variant ID
   */
  async getCartItemByProduct(cartId: string, productId: string, variantId?: string | null): Promise<CartItem | null> {
    try {
      let query = supabaseAdmin
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId);

      if (variantId) {
        query = query.eq('variant_id', variantId);
      } else {
        query = query.is('variant_id', null);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error(`Database error fetching cart item for cart ${cartId}: ${error.message}`);
        throw new AppError('Failed to fetch cart item details', 500);
      }

      return data as CartItem;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error getCartItemByProduct: ${err}`);
      throw new AppError('Internal server error during cart item retrieval', 500);
    }
  }

  /**
   * Find cart item by ID
   */
  async getCartItemById(itemId: string): Promise<CartItem | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        logger.error(`Database error fetching cart item ${itemId}: ${error.message}`);
        throw new AppError('Failed to fetch cart item details', 500);
      }

      return data as CartItem;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error getCartItemById: ${err}`);
      throw new AppError('Internal server error during cart item retrieval', 500);
    }
  }

  /**
   * Add new item to cart
   */
  async createCartItem(cartId: string, productId: string, quantity: number, variantId?: string | null): Promise<CartItem> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .insert([{ cart_id: cartId, product_id: productId, quantity, variant_id: variantId || null }])
        .select()
        .single();

      if (error) {
        logger.error(`Database error creating cart item: ${error.message}`);
        throw new AppError('Failed to add item to cart', 500);
      }

      return data as CartItem;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error createCartItem: ${err}`);
      throw new AppError('Internal server error during cart item creation', 500);
    }
  }

  /**
   * Update quantity of an existing cart item
   */
  async updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItem> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .select()
        .single();

      if (error) {
        logger.error(`Database error updating quantity for item ${itemId}: ${error.message}`);
        throw new AppError('Failed to update cart item quantity', 500);
      }

      return data as CartItem;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error updateCartItemQuantity: ${err}`);
      throw new AppError('Internal server error during cart item updates', 500);
    }
  }

  /**
   * Delete an item from the cart
   */
  async deleteCartItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        logger.error(`Database error deleting cart item ${itemId}: ${error.message}`);
        throw new AppError('Failed to remove item from cart', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error deleteCartItem: ${err}`);
      throw new AppError('Internal server error during cart item removal', 500);
    }
  }

  /**
   * Clear all items from a cart
   */
  async clearCart(cartId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        logger.error(`Database error clearing cart ${cartId}: ${error.message}`);
        throw new AppError('Failed to clear cart items', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error clearCart: ${err}`);
      throw new AppError('Internal server error during cart clearing', 500);
    }
  }

  /**
   * Apply coupon code to cart
   */
  async applyCouponCode(cartId: string, code: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('cart')
        .update({ coupon_code: code })
        .eq('id', cartId);

      if (error) {
        logger.error(`Database error applying coupon to cart ${cartId}: ${error.message}`);
        throw new AppError('Failed to apply coupon', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error applyCouponCode: ${err}`);
      throw new AppError('Internal server error', 500);
    }
  }

  /**
   * Remove coupon code from cart
   */
  async removeCouponCode(cartId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('cart')
        .update({ coupon_code: null })
        .eq('id', cartId);

      if (error) {
        logger.error(`Database error removing coupon from cart ${cartId}: ${error.message}`);
        throw new AppError('Failed to remove coupon', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error removeCouponCode: ${err}`);
      throw new AppError('Internal server error', 500);
    }
  }

  /**
   * Apply gift card code to cart
   */
  async applyGiftCardCode(cartId: string, code: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('cart')
        .update({ gift_card_code: code })
        .eq('id', cartId);

      if (error) {
        logger.error(`Database error applying gift card to cart ${cartId}: ${error.message}`);
        throw new AppError('Failed to apply gift card', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error applyGiftCardCode: ${err}`);
      throw new AppError('Internal server error', 500);
    }
  }

  /**
   * Remove gift card code from cart
   */
  async removeGiftCardCode(cartId: string): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('cart')
        .update({ gift_card_code: null })
        .eq('id', cartId);

      if (error) {
        logger.error(`Database error removing gift card from cart ${cartId}: ${error.message}`);
        throw new AppError('Failed to remove gift card', 500);
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error removeGiftCardCode: ${err}`);
      throw new AppError('Internal server error', 500);
    }
  }
}
