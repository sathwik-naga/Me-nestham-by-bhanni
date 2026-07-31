import { OrderRepository } from '../repositories/order.repository';
import { CartRepository } from '../repositories/cart.repository';
import { ProductRepository } from '../repositories/product.repository';
import { PromotionRepository } from '../repositories/promotion.repository';
import { PromotionService } from './promotion.service';
import { couponValidator } from '../utils/coupon.validator';
import { couponEngine } from '../utils/coupon.engine';
import { Order, OrderStatus, PaymentStatus, CheckoutInput } from '../interfaces/order.interface';
import { AppError } from '../middleware/error';
import { supabaseAdmin } from '../lib/supabase';
import { EmailService } from './email.service';
import { EmailRepository } from '../repositories/email.repository';
import { ResendProvider } from '../providers/resend.provider';
import logger from '../utils/logger';

const emailService = new EmailService(new EmailRepository(), new ResendProvider());

export class OrderService {
  constructor(
    private orderRepository: OrderRepository,
    private cartRepository: CartRepository,
    private productRepository: ProductRepository
  ) {}

  /**
   * Run client address validation, verify stock/active limits, recalculate totals on backend, and invoke atomic db RPC checkout transaction
   */
  async placeOrder(userId: string, input: CheckoutInput): Promise<Order> {
    logger.info(`Starting checkout process for user ID: ${userId}`);

    // 1. Fetch user's cart
    const cart = await this.cartRepository.getOrCreateCart(userId);
    const cartItems = await this.cartRepository.getCartItems(cart.id);

    // 2. Verify cart is not empty
    if (!cartItems || cartItems.length === 0) {
      throw new AppError('Your shopping cart is empty', 400);
    }

    // 3. Defensive validations on prices/stock before hitting DB RPC
    let subtotal = 0;
    for (const item of cartItems) {
      const product = await this.productRepository.getById(item.product_id);
      if (!product) {
        throw new AppError(`Product details not found for ID: ${item.product_id}`, 404);
      }

      if (!product.is_active) {
        throw new AppError(`Product "${product.name}" is no longer active and cannot be purchased`, 400);
      }

      if (product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for "${product.name}". Only ${product.stock} left in stock.`, 400);
      }

      if (item.quantity <= 0) {
        throw new AppError(`Invalid item quantity of ${item.quantity} for "${product.name}"`, 400);
      }

      subtotal += product.price * item.quantity;
    }

    // 4. Recalculate Promotion/Coupon discounts (Never trust frontend values)
    let discount = 0;
    let appliedCouponObj = null;
    let finalCouponCode: string | null = null;

    const promotionRepository = new PromotionRepository();
    const promotionService = new PromotionService(promotionRepository);

    const userOrdersCount = await promotionRepository.getUserTotalOrdersCount(userId);
    const automaticPromos = await promotionRepository.getAutomaticPromotions();
    const activeAutoPromo = couponEngine.evaluateAutomaticPromotions(
      automaticPromos,
      cartItems,
      userOrdersCount,
      subtotal
    );

    if (cart.coupon_code) {
      const coupon = await promotionRepository.getByCode(cart.coupon_code);
      if (coupon) {
        const userCouponUsageCount = await promotionRepository.getUserCouponUsageCount(userId, coupon.id);
        const validation = couponValidator.validateCoupon(
          coupon,
          cartItems,
          userOrdersCount,
          userCouponUsageCount,
          subtotal
        );

        if (validation.isValid) {
          if (activeAutoPromo && !coupon.stackable) {
            if (activeAutoPromo.priority > coupon.priority) {
              appliedCouponObj = activeAutoPromo;
              discount = couponEngine.calculateDiscount(activeAutoPromo, cartItems);
            } else {
              appliedCouponObj = coupon;
              discount = couponEngine.calculateDiscount(coupon, cartItems);
              finalCouponCode = coupon.code;
            }
          } else {
            appliedCouponObj = coupon;
            discount = couponEngine.calculateDiscount(coupon, cartItems);
            finalCouponCode = coupon.code;
          }
        } else {
          throw new AppError(`The applied coupon is no longer valid: ${validation.error || 'Validation failed'}`, 400);
        }
      } else if (activeAutoPromo) {
        appliedCouponObj = activeAutoPromo;
        discount = couponEngine.calculateDiscount(activeAutoPromo, cartItems);
      }
    } else if (activeAutoPromo) {
      appliedCouponObj = activeAutoPromo;
      discount = couponEngine.calculateDiscount(activeAutoPromo, cartItems);
    }

    // 5. Calculate shipping fee
    let shipping = 0;
    const isFreeShipping = appliedCouponObj && appliedCouponObj.type === 'free_shipping';
    if (input.shipping_fee === 150) {
      shipping = 150;
    } else {
      if (isFreeShipping) {
        shipping = 0;
      } else {
        shipping = (subtotal - discount) >= 499 ? 0 : 99;
      }
    }

    // 6. Calculate Tax
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = parseFloat((taxableAmount * 0.18).toFixed(2));

    // 7. Evaluate Gift Card discounts
    let giftCardDiscount = 0;
    let finalGiftCardCode: string | null = null;
    let giftCardObj = null;

    if (cart.gift_card_code) {
      const giftCard = await promotionRepository.getGiftCardByCode(cart.gift_card_code);
      if (giftCard) {
        const gcVal = couponValidator.validateGiftCard(giftCard);
        if (gcVal.isValid) {
          const grandTotalBeforeGc = taxableAmount + shipping + tax;
          giftCardDiscount = Math.min(Number(giftCard.balance), grandTotalBeforeGc);
          finalGiftCardCode = giftCard.code;
          giftCardObj = giftCard;
        } else {
          throw new AppError(`The applied gift card is no longer valid: ${gcVal.error || 'Validation failed'}`, 400);
        }
      }
    }

    // 8. Run atomic checkout in Postgres
    const orderId = await this.orderRepository.createOrderAtomic(userId, {
      billing_address: input.billing_address,
      shipping_address: input.shipping_address,
      shipping_fee: shipping,
      discount: discount,
      tax: tax,
      coupon_code: finalCouponCode,
      gift_card_code: finalGiftCardCode,
      gift_card_discount: giftCardDiscount,
    });

    // 9. Record usage / deductions
    if (finalCouponCode) {
      await promotionService.trackUsage(userId, finalCouponCode, orderId, discount);
    }

    if (finalGiftCardCode && giftCardObj && giftCardDiscount > 0) {
      await promotionRepository.decrementGiftCardBalance(giftCardObj.id, giftCardDiscount);
      await promotionRepository.createGiftCardUsage({
        gift_card_id: giftCardObj.id,
        user_id: userId,
        order_id: orderId,
        amount_used: giftCardDiscount,
      });
    }

    // 10. Fetch fully snapshotted order details
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('Order database snapshot not found after checkout creation', 500);
    }

    logger.info(`Checkout successfully completed. Order ID: ${orderId}`);

    // Trigger confirmation and admin emails in the background (prevent blocking checkout)
    setImmediate(async () => {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
        const email = user?.email || order.shipping_address?.email || '';
        const fullName = order.shipping_address?.full_name || user?.user_metadata?.full_name || 'Customer';

        if (email) {
          await emailService.sendOrderConfirmationEmail(email, fullName, order);
        }

        await emailService.sendAdminNewOrderEmail(order);

        // Low stock check
        const threshold = Number(process.env.LOW_STOCK_THRESHOLD || '5');
        if (order.items) {
          for (const item of order.items) {
            if (item.product_id) {
              const product = await this.productRepository.getById(item.product_id);
              if (product && product.stock <= threshold) {
                await emailService.sendAdminLowStockEmail(product.name, product.slug, product.stock);
              }
            }
          }
        }
      } catch (emailErr) {
        logger.error(`Error in order placement email notification triggers: ${emailErr}`);
      }
    });

    return order;
  }

  /**
   * Fetch details of a single order (Enforces owner or admin credentials check)
   */
  async getOrderDetails(userId: string, isAdmin: boolean, orderId: string): Promise<Order> {
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('Order records not found', 404);
    }

    // Enforce authorization bounds
    if (!isAdmin && order.user_id !== userId) {
      throw new AppError('You are not authorized to view this order record', 403);
    }

    return order;
  }

  /**
   * Retrieve list of orders with pagination details (Admin sees all, Users see own)
   */
  async listOrders(
    userId: string,
    isAdmin: boolean,
    page: number,
    limit: number
  ): Promise<{ orders: Order[]; total: number; page: number; limit: number; totalPages: number }> {
    let result: { orders: Order[]; total: number };

    if (isAdmin) {
      logger.info(`Admin retrieval of system orders list (Page: ${page}, Limit: ${limit})`);
      result = await this.orderRepository.getAllOrders(page, limit);
    } else {
      logger.info(`User ${userId} retrieval of orders list (Page: ${page}, Limit: ${limit})`);
      result = await this.orderRepository.getUserOrders(userId, page, limit);
    }

    const totalPages = Math.ceil(result.total / limit) || 1;

    return {
      orders: result.orders,
      total: result.total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Modify status states of an order (Admin only)
   */
  async updateOrderState(
    orderId: string,
    updates: { status?: OrderStatus; payment_status?: PaymentStatus }
  ): Promise<Order> {
    logger.info(`Admin status update request for order ID: ${orderId} (Status: ${updates.status}, Payment: ${updates.payment_status})`);

    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      throw new AppError('Order records not found', 404);
    }

    const updatedOrder = await this.orderRepository.updateOrderStatus(orderId, updates);
    return updatedOrder;
  }
}
