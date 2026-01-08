import { useEffect, useState } from 'react';
import api from '../lib/api';
import { DollarSign, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/admin/dashboard/stats')
      .then(res => {
        if (mounted) setStats(res.data);
      })
      .catch(console.error)
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Error loading stats</div>;

  const cards = [
    { label: 'Today Revenue', value: `$${stats.todayRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Orders', value: stats.activeOrders, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100' },
    { label: 'Total Revenue', value: `$${stats.totalRevenue.toFixed(2)}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div key={card.label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.bg}`}>
                <card.icon className={card.color} size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for charts or recent orders */}
      <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        <p className="text-gray-500">Charts and recent orders table will go here.</p>
      </div>
    </div>
  );
}
