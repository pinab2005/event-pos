import sql from "@/lib/db";
import KitchenView from "./kitchen-view";
import type { Order, OrderItem } from "../orders/page";

export const dynamic = 'force-dynamic';

type Row = {
  id: number;
  total: number;
  status: string | null;
  created_at: string;
  item_name: string | null;
  item_price: number | null;
  quantity: number | null;
  modifiers: string | null;
};

export default async function KitchenPage() {
  const rows = (await sql`
    SELECT
      o.id, o.total, o.status, o.created_at,
      oi.name  AS item_name,
      oi.price AS item_price,
      oi.quantity,
      oi.modifiers
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id = o.id
    WHERE o.status = 'new' OR o.status IS NULL
    ORDER BY o.created_at ASC, oi.id
  `) as Row[];

  const orderMap = new Map<number, Order>();
  for (const row of rows) {
    if (!orderMap.has(row.id)) {
      orderMap.set(row.id, {
        id: row.id,
        total: Number(row.total),
        status: row.status ?? 'new',
        created_at: row.created_at,
        items: [],
      });
    }
    if (row.item_name) {
      orderMap.get(row.id)!.items.push({
        name: row.item_name,
        price: Number(row.item_price),
        quantity: row.quantity!,
        modifiers: row.modifiers,
      } as OrderItem);
    }
  }

  return <KitchenView orders={Array.from(orderMap.values())} />;
}
