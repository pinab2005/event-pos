'use client'

import { useState, useTransition } from 'react';
import { placeOrder } from './actions';
import type { CartItem, MenuItem, Modifier, SelectedModifier } from '@/lib/types';

export default function POSScreen({ menuItems }: { menuItems: MenuItem[] }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleItemTap = (item: MenuItem) => {
    if (item.modifiers.length === 0) {
      addToCart(item, []);
    } else {
      setPendingItem(item);
      setCheckedIds(new Set());
    }
  };

  const toggleModifier = (modifier: Modifier) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      next.has(modifier.id) ? next.delete(modifier.id) : next.add(modifier.id);
      return next;
    });
  };

  const confirmAdd = () => {
    if (!pendingItem) return;
    const selected: SelectedModifier[] = pendingItem.modifiers.filter(m => checkedIds.has(m.id));
    addToCart(pendingItem, selected);
    setPendingItem(null);
  };

  const addToCart = (item: MenuItem, selectedModifiers: SelectedModifier[]) => {
    const cartKey = `${item.id}-${selectedModifiers.map(m => m.id).sort().join(',')}`;
    const totalItemPrice = item.price + selectedModifiers.reduce((s, m) => s + m.priceAdjustment, 0);

    setCart(prev => {
      const existing = prev.find(c => c.cartKey === cartKey);
      if (existing) {
        return prev.map(c => c.cartKey === cartKey ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { cartKey, id: item.id, name: item.name, basePrice: item.price, totalItemPrice, quantity: 1, selectedModifiers }];
    });
  };

  const adjustQty = (cartKey: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.cartKey === cartKey ? { ...c, quantity: c.quantity + delta } : c)
         .filter(c => c.quantity > 0)
    );
  };

  const orderTotal = cart.reduce((sum, c) => sum + c.totalItemPrice * c.quantity, 0);

  const modalPrice = pendingItem
    ? pendingItem.price + pendingItem.modifiers
        .filter(m => checkedIds.has(m.id))
        .reduce((s, m) => s + m.priceAdjustment, 0)
    : 0;

  const printReceipt = (orderId: number, items: CartItem[], total: number) => {
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;

    const rows = items.map(item => `
      <tr>
        <td>${item.quantity}x ${item.name}</td>
        <td class="price">$${(item.totalItemPrice * item.quantity).toFixed(2)}</td>
      </tr>
      ${item.selectedModifiers.length > 0 ? `
      <tr>
        <td colspan="2" class="mods">${item.selectedModifiers.map(m => m.name).join(', ')}</td>
      </tr>` : ''}
    `).join('');

    win.document.write(`<!DOCTYPE html><html><head><title>Order #${orderId}</title>
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
      <div class="center" style="font-weight:bold; font-size:22px">ORDER #${orderId}</div>
      <div class="center" style="font-size:11px; margin-bottom:4px">${new Date().toLocaleString()}</div>
      <div class="divider"></div>
      <table>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="total">
            <td>TOTAL</td>
            <td class="price">$${total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
    </body></html>`);

    win.document.close();
    win.focus();
    win.onafterprint = () => win.close();
    win.print();
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0 || isPending) return;
    startTransition(async () => {
      try {
        const orderId = await placeOrder(cart, orderTotal);
        printReceipt(orderId, cart, orderTotal);
        setCart([]);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2500);
      } catch {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 2500);
      }
    });
  };

  return (
    <>
      <div className="flex h-screen bg-zinc-100">
        {/* Menu grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <h1 className="text-2xl font-bold text-zinc-900 mb-4">Menu</h1>
          <div className="grid grid-cols-2 gap-3">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleItemTap(item)}
                className="bg-white rounded-xl p-4 text-left shadow-sm hover:shadow-md active:scale-95 transition-all"
              >
                <div className="font-semibold text-zinc-900 leading-snug">{item.name}</div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-zinc-500">${item.price.toFixed(2)}</span>
                  {item.modifiers.length > 0 && (
                    <span className="text-xs text-zinc-400">customize →</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="w-80 bg-white border-l border-zinc-200 flex flex-col">
          <div className="px-5 py-4 border-b border-zinc-200">
            <h2 className="text-xl font-bold text-zinc-900">Current Order</h2>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {cart.length === 0 ? (
              <p className="text-zinc-400 text-sm text-center mt-10">Tap items to add them</p>
            ) : (
              cart.map(item => (
                <div key={item.cartKey} className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 leading-snug">{item.name}</div>
                    {item.selectedModifiers.length > 0 && (
                      <div className="text-xs text-zinc-400 mt-0.5 leading-snug">
                        {item.selectedModifiers.map(m => m.name).join(', ')}
                      </div>
                    )}
                    <div className="text-sm text-zinc-500 mt-0.5">
                      ${(item.totalItemPrice * item.quantity).toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    <button
                      onClick={() => adjustQty(item.cartKey, -1)}
                      className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 font-bold text-sm hover:bg-zinc-200 active:scale-90 transition-all"
                    >−</button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => adjustQty(item.cartKey, 1)}
                      className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-700 font-bold text-sm hover:bg-zinc-200 active:scale-90 transition-all"
                    >+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-5 py-4 border-t border-zinc-200 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-zinc-900">Total</span>
              <span className="text-xl font-bold text-zinc-900">${orderTotal.toFixed(2)}</span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="w-full text-sm text-zinc-400 hover:text-zinc-600 transition-colors py-1"
              >
                Clear order
              </button>
            )}
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || isPending}
              className={`w-full py-3 rounded-xl font-bold text-lg transition-all active:scale-95 ${
                status === 'success'
                  ? 'bg-green-500 text-white'
                  : status === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {isPending
                ? 'Placing...'
                : status === 'success'
                ? '✓ Order Placed!'
                : status === 'error'
                ? 'Error — Try Again'
                : 'Place Order'}
            </button>
          </div>
        </div>
      </div>

      {/* Modifier modal */}
      {pendingItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={(e) => e.target === e.currentTarget && setPendingItem(null)}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            <div className="px-5 pt-5 pb-3 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">{pendingItem.name}</h3>
              <p className="text-zinc-500 text-sm mt-0.5">${modalPrice.toFixed(2)}</p>
            </div>

            <div className="px-5 py-3 space-y-2 max-h-72 overflow-y-auto">
              {pendingItem.modifiers.map(modifier => (
                <button
                  key={modifier.id}
                  onClick={() => toggleModifier(modifier)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all text-left ${
                    checkedIds.has(modifier.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-zinc-200 bg-white hover:border-zinc-300'
                  }`}
                >
                  <span className="font-medium text-sm text-zinc-900">{modifier.name}</span>
                  {modifier.priceAdjustment > 0 && (
                    <span className="text-sm text-zinc-500">+${modifier.priceAdjustment.toFixed(2)}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="px-5 pb-5 pt-3 flex gap-3">
              <button
                onClick={() => setPendingItem(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-zinc-200 text-zinc-700 font-medium hover:border-zinc-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmAdd}
                className="flex-1 py-2.5 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 active:scale-95 transition-all"
              >
                Add to Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
