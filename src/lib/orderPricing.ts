// Server-side order pricing — single source of truth for Stripe & PayPal routes.
// NEVER trust client-sent prices: everything is recomputed from the database.
import { SupabaseClient } from '@supabase/supabase-js';

export const FREE_SHIPPING_THRESHOLD = 50;
export const SHIPPING_COST = 5.99;

export interface PricedItem {
  productId: string;
  name: string;
  brand: string;
  image?: string;
  unitPrice: number; // price from DB, in EUR
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderPricing {
  items: PricedItem[];
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  couponCode?: string;
  loyaltyDiscount: number;
  total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Recompute the full order price server-side.
 * - Prices come from the `products` table (client prices are ignored).
 * - `couponCode` is validated against the `coupons` table.
 * - `useLoyalty` is validated by recomputing the user's points from paid orders.
 */
export async function priceOrder(
  supabaseAdmin: SupabaseClient,
  rawItems: any[],
  opts: { couponCode?: string; useLoyalty?: boolean; userId?: string | null; excludeOrderId?: string } = {}
): Promise<{ pricing?: OrderPricing; error?: string }> {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return { error: 'No hay productos en el carrito' };
  }

  const productIds: string[] = rawItems.map((i: any) => i?.product?.id).filter(Boolean);
  if (productIds.length !== rawItems.length) return { error: 'Carrito inválido' };

  const { data: dbProducts, error: dbError } = await supabaseAdmin
    .from('products')
    .select('id, name, brand, price, images, in_stock, stock')
    .in('id', productIds);

  if (dbError || !dbProducts) return { error: 'Error al verificar productos' };

  const map = new Map(dbProducts.map((p: any) => [p.id, p]));
  const items: PricedItem[] = [];

  for (const raw of rawItems) {
    const db = map.get(raw.product.id);
    if (!db) return { error: `Producto no encontrado: ${raw.product.id}` };
    const quantity = Math.max(1, Math.min(99, Math.floor(Number(raw.quantity) || 1)));
    items.push({
      productId: db.id,
      name: db.name,
      brand: db.brand,
      image: db.images?.[0],
      unitPrice: Number(db.price),
      quantity,
      selectedSize: raw.selectedSize || undefined,
      selectedColor: raw.selectedColor || undefined,
    });
  }

  const subtotal = round2(items.reduce((s, i) => s + i.unitPrice * i.quantity, 0));
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  // ── Coupon (validated against DB) ────────────────────────────────────────
  let couponDiscount = 0;
  let couponCode: string | undefined;
  if (opts.couponCode) {
    const { data: coupon } = await supabaseAdmin
      .from('coupons')
      .select('*')
      .eq('code', String(opts.couponCode).toUpperCase())
      .eq('active', true)
      .maybeSingle();

    if (!coupon) return { error: 'Cupón inválido o no activo' };
    if (coupon.min_purchase && subtotal < coupon.min_purchase) {
      return { error: `El cupón requiere una compra mínima de €${coupon.min_purchase}` };
    }
    if (coupon.max_uses && coupon.uses >= coupon.max_uses) {
      return { error: 'Cupón agotado' };
    }
    couponDiscount = coupon.discount_type === 'percentage'
      ? round2((subtotal * coupon.discount_value) / 100)
      : round2(Number(coupon.discount_value));
    couponCode = coupon.code;
  }

  // ── Loyalty points (recomputed from paid orders — 1€ = 1pt, 100pts = 1€) ─
  // Earned points come from paid orders; redeemed points (orders.loyalty_discount)
  // are subtracted so the same points can't be spent twice.
  let loyaltyDiscount = 0;
  if (opts.useLoyalty && opts.userId) {
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, total, status, loyalty_discount')
      .eq('user_id', opts.userId);

    const rows = (orders || []).filter((o: any) => o.id !== opts.excludeOrderId);
    const totalSpent = rows
      .filter((o: any) => ['processing', 'shipped', 'delivered'].includes(o.status))
      .reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
    const earnedPoints = Math.floor(totalSpent);
    const redeemedPoints = rows
      .filter((o: any) => o.status !== 'cancelled')
      .reduce((s: number, o: any) => s + (Number(o.loyalty_discount) || 0) * 100, 0);

    loyaltyDiscount = Math.max(0, Math.floor((earnedPoints - redeemedPoints) / 100)); // whole euros
  }

  const total = round2(Math.max(0, subtotal + shipping - couponDiscount - loyaltyDiscount));

  return {
    pricing: { items, subtotal, shipping, couponDiscount, couponCode, loyaltyDiscount, total },
  };
}
