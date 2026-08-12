'use server'

import sql from "@/lib/db";
import type { CartItem } from "@/lib/types";

export async function placeOrder(cart: CartItem[], total: number): Promise<number> {
  const result = await sql`
    INSERT INTO orders (total) VALUES (${total}) RETURNING id
  `;
  const orderId = result[0].id;

  for (const item of cart) {
    const modifiers = item.selectedModifiers.length > 0
      ? item.selectedModifiers.map(m => m.name).join(', ')
      : null;

    await sql`
      INSERT INTO order_items (order_id, menu_item_id, name, price, quantity, modifiers)
      VALUES (${orderId}, ${item.id}, ${item.name}, ${item.totalItemPrice}, ${item.quantity}, ${modifiers})
    `;
  }

  return orderId;
}
