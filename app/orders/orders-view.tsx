'use client'

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '../actions';
import type { Order, OrderItem } from './page';

const PrinterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/>
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);

function printReceipt(order: Order) {
  const win = window.open('', '_blank', 'width=400,height=600');
  if (!win) return;

  const rows = order.items.map((item: OrderItem) => `
    <tr>
      <td>${item.quantity}x ${item.name}</td>
      <td class="price">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
    ${item.modifiers ? `<tr><td colspan="2" class="mods">${item.modifiers}</td></tr>` : ''}
  `).join('');

  const date = new Date(order.created_at).toLocaleString();

  win.document.write(`<!DOCTYPE html><html><head><title>Order #${order.id}</title>
    <style>
      @page { size: 76mm auto; margin: 3mm; }
      * { box-sizing: border-box; }
      body { font-family: monospace; font-size: 14px; margin: 0; padding: 0; width: 100%; }
      .center { text-align: center; }
      .divider { border-top: 1px dashed #000; margin: 5px 0; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 2px 0; vertical-align: top; word-break: break-word; }
      td.price { text-align: right; white-space: nowrap; padding-left: 6px; width: 1%; }
      .mods { font-size: 12px; padding-left: 12px; color: #333; }
      .total td { font-weight: bold; font-size: 16px; border-top: 1px dashed #000; padding-top: 5px; }
    </style></head><body>
    <div class="center" style="font-weight:bold;font-size:22px">ORDER #${order.id}</div>
    <div class="center" style="font-size:11px;margin-bottom:4px">${date}</div>
    <div class="divider"></div>
    <table>
      <tbody>${rows}</tbody>
      <tfoot><tr class="total"><td>TOTAL</td><td class="price">$${order.total.toFixed(2)}</td></tr></tfoot>
    </table>
  </body></html>`);
  win.document.close();
  win.focus();
  win.onafterprint = () => win.close();
  win.print();
}

function OrderCard({ order }: { order: Order }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isNew = order.status === 'new';

  const toggleStatus = () => {
    startTransition(async () => {
      await updateOrderStatus(order.id, isNew ? 'ready' : 'new');
      router.refresh();
    });
  };

  const date = new Date(order.created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-bold text-zinc-900">Order #{order.id}</span>
        <button
          onClick={toggleStatus}
          disabled={isPending}
          className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
            isNew
              ? 'bg-orange-100 text-orange-600 hover:bg-orange-200'
              : 'bg-green-100 text-green-600 hover:bg-green-200'
          }`}
        >
          {isNew ? 'New' : 'Ready'}
        </button>
      </div>

      <p className="text-xs text-zinc-400">{date}</p>

      <div className="space-y-1">
        {order.items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-700">{item.quantity} x {item.name}</span>
              <span className="text-zinc-700 shrink-0 pl-2">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            {item.modifiers && (
              <p className="text-xs text-zinc-400 pl-3">{item.modifiers}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
        <span className="font-bold text-zinc-900">${order.total.toFixed(2)}</span>
        <button
          onClick={() => printReceipt(order)}
          className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-300 px-3 py-1.5 rounded-lg transition-colors"
        >
          <PrinterIcon />
          Reprint
        </button>
      </div>
    </div>
  );
}

export default function OrdersView({ orders }: { orders: Order[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-5">
      <p className="text-xs font-semibold text-zinc-400 tracking-widest mb-4">ORDER HISTORY</p>
      {orders.length === 0 ? (
        <p className="text-zinc-400 text-sm">No orders yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {orders.map(order => <OrderCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
