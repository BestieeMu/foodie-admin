import { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
import clsx from 'clsx';
import { Clock, CheckCircle, Truck, XCircle, ChevronRight } from 'lucide-react';
import type { Order } from '../types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-blue-100 text-blue-800', icon: Clock },
  ready_for_pickup: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  picked_up: { label: 'Picked Up', color: 'bg-purple-100 text-purple-800', icon: Truck },
  on_the_way: { label: 'On Way', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  const fetchOrders = useCallback(() => {
    // We do not set loading to true here to avoid UI flicker on poll
    api.get('/admin/orders/my')
      .then(res => setOrders(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (error) {
      console.error('Failed to update status', error);
      alert('Failed to update status');
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'active') return ['pending', 'preparing', 'ready_for_pickup', 'on_the_way'].includes(o.status);
    if (filter === 'completed') return ['delivered', 'cancelled'].includes(o.status);
    return true;
  });

  if (loading && !orders.length) return <div>Loading orders...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {['active', 'completed', 'all'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors',
                filter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => {
          const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
          const StatusIcon = status.icon;

          return (
            <div key={order.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-bold text-gray-900">#{order.orderNumber || order.id.slice(-6)}</span>
                    <span className={clsx('px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1', status.color)}>
                      <StatusIcon size={12} />
                      {status.label}
                    </span>
                    <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{order.items.length} items</span> • Total: <span className="font-bold text-gray-900">${order.total.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {order.type === 'delivery' ? (
                      <span className="flex items-center gap-1">
                        <Truck size={14} /> Delivery to: {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <CheckCircle size={14} /> Pickup
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Accept & Prepare
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {order.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus(order.id, 'ready_for_pickup')}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready_for_pickup' && order.type === 'pickup' && (
                    <button
                      onClick={() => updateStatus(order.id, 'picked_up')}
                      className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
                    >
                      Mark Picked Up
                    </button>
                  )}
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              
              {/* Order Items Detail */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <ul className="space-y-2">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700 flex justify-between">
                      <span>
                        <span className="font-bold">{item.quantity}x</span> {item.name || item.menuItem?.name}
                        {item.choice && (
                          <span className="text-xs text-gray-500 ml-2">
                            {[
                              item.choice.sizeId, 
                              ...(item.choice.addOnIds || []), 
                              ...(item.choice.extraIds || [])
                            ].filter(Boolean).join(', ')}
                          </span>
                        )}
                      </span>
                      <span>${((item.price || item.menuItem?.price || 0) * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
