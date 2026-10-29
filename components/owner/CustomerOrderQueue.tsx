'use client';

import { useEffect, useState } from 'react';
import type { OrderWorkItem } from '../../lib/confirmedOrders';
import type { OrderJob } from '../../lib/componentOrders';

export default function CustomerOrderQueue({ onOpen }: { onOpen: (job: OrderJob) => void }) {
  const [orders, setOrders] = useState<OrderWorkItem[]>([]);
  const [message, setMessage] = useState('Checking the order connection…');
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  async function refresh(signal?: AbortSignal) {
    setBusy(true);
    try {
      const res = await fetch('/api/owner/orders?limit=20', { cache: 'no-store', signal });
      const data = await res.json();
      if (!res.ok) { setConnected(false); setOrders([]); setMessage(data.message || 'The order connection could not be checked.'); return; }
      setOrders(data.orders); setConnected(true);
      setMessage(data.orders.length ? 'Latest 20 received test orders. Each order creates its component draft automatically.' : 'Order storage connected; no test orders received. Live checkout is not connected.');
    } catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) { setConnected(false); setMessage('The order queue could not be loaded. Retry before assuming it is empty.'); } }
    finally { setBusy(false); }
  }
  useEffect(() => { const controller = new AbortController(); void refresh(controller.signal); return () => controller.abort(); }, []);
  return <section className="owner-incoming" aria-labelledby="incoming-title"><div className="owner-section-heading"><div><p className="eyebrow">Customer order → components → workshop</p><h2 id="incoming-title">Incoming sideboard orders</h2></div><button type="button" disabled={busy} onClick={() => void refresh()}>Refresh orders</button></div><p role="status">{message}</p><ol className="owner-order-flow"><li>Confirmed order</li><li>Automatic component draft</li><li>Engineering / owner review</li><li>Workshop release</li></ol>{connected && orders.length > 0 && <div className="owner-incoming-list">{orders.map(item => <article key={item.order.orderId}><div><strong>{item.order.orderId}</strong><span>{item.configuration.width} × {item.configuration.height} × {item.configuration.depth} mm · {item.order.quantity} unit{item.order.quantity > 1 ? 's' : ''}</span><small>TEST ORDER · Engineering hold · Supplier release blocked</small></div><button type="button" onClick={() => onOpen(item.componentJob)}>Open cutting-list draft ↗</button></article>)}</div>}<p className="owner-help">This is the future confirmed-order queue. It is separate from saved customer designs and manually prepared component orders. Live ordering, production rules and automatic supplier delivery are not enabled.</p></section>;
}
