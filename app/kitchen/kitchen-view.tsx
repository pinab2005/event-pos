'use client'

import { useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrderStatus } from '../actions';
import type { Order } from '../orders/page';

function KitchenCard({ order }: { order: Order }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const markReady = () => {
    startTransition(async () => {
      await updateOrderStatus(order.id, 'ready');
      router.refresh();
    });
  };

  const date = new Date(order.created_at).toLocaleString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 border-l-4 border-orange-400">
      <div className="flex items-center justify-between">
        <span className="font-bold text-zinc-900 text-lg">Order #{order.id}</span>
        <span className="text-xs text-zinc-400">{date}</span>
      </div>

      <div className="space-y-2">
        {order.items.map((item, i) => (
          <div key={i}>
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-orange-500 text-lg">{item.quantity}×</span>
              <span className="font-medium text-zinc-900">{item.name}</span>
            </div>
            {item.modifiers && (
              <p className="text-sm text-zinc-500 pl-7">{item.modifiers}</p>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={markReady}
        disabled={isPending}
        className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition-all active:scale-95 disabled:opacity-40"
      >
        {isPending ? 'Marking...' : '✓ Mark Ready'}
      </button>
    </div>
  );
}

export default function KitchenView({ orders }: { orders: Order[] }) {
  const router = useRouter();

  // Auto-refresh every 15 seconds to pick up new orders
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="flex-1 overflow-y-auto p-5">
      <p className="text-xs font-semibold text-zinc-400 tracking-widest mb-4">KITCHEN — ACTIVE ORDERS</p>
      {orders.length === 0 ? (
        <div className="text-center mt-20">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-zinc-400 font-medium">All caught up — no pending orders</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {orders.map(order => <KitchenCard key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
}
