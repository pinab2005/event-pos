import sql from "@/lib/db";
import type { MenuItem } from "@/lib/types";
import POSScreen from "./pos-screen";

type Row = {
  id: number;
  name: string;
  price: number;
  modifier_id: number | null;
  modifier_name: string | null;
  price_adjustment: number | null;
};

export default async function Home() {
  const rows = (await sql`
    SELECT
      mi.id,
      mi.name,
      mi.price,
      m."Id"                  AS modifier_id,
      m.modifier_name,
      m."Price-adjustment"    AS price_adjustment
    FROM menu_items mi
    LEFT JOIN menu_item_modifiers mim ON mim.menu_item_id = mi.id
    LEFT JOIN modifiers m ON m."Id" = mim.modifier_id
    WHERE mi.active = true
    ORDER BY mi.sort_order, mi.id, m."Id"
  `) as Row[];

  const itemMap = new Map<number, MenuItem>();
  for (const row of rows) {
    if (!itemMap.has(row.id)) {
      itemMap.set(row.id, {
        id: row.id,
        name: row.name,
        price: Number(row.price),
        modifiers: [],
      });
    }
    if (row.modifier_id !== null) {
      itemMap.get(row.id)!.modifiers.push({
        id: row.modifier_id,
        name: row.modifier_name!,
        priceAdjustment: Number(row.price_adjustment),
      });
    }
  }

  return <POSScreen menuItems={Array.from(itemMap.values())} />;
}
