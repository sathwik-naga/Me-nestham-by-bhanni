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
            images:product_images(*)
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
      const formattedItems = rawItems.map((item) => ({
        ...item,
        product: this.formatJoinedProduct(item.product as Record<string, unknown> | null),
      })) as unknown as CartItem[];

      return formattedItems;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error(`Unexpected error getCartItems: ${err}`);
      throw new AppError('Internal server error during cart retrieval', 500);
    }
  }

  /**
   * Find single cart item by cart ID and product ID
   */
  async getCartItemByProduct(cartId: string, productId: string): Promise<CartItem | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .select('*')
        .eq('cart_id', cartId)
        .eq('product_id', productId)
        .single();

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
  async createCartItem(cartId: string, productId: string, quantity: number): Promise<CartItem> {
    try {
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .insert([{ cart_id: cartId, product_id: productId, quantity }])
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
}
