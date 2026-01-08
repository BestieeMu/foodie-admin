import { useEffect, useState } from 'react';
import api from '../lib/api';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Wallet } from 'lucide-react';

interface Transaction {
  id: string;
  orderId: string;
  amount: number;
  fee: number;
  net: number;
  date: string;
  status: string;
}

interface WalletData {
  totalRevenue: number;
  commission: number;
  balance: number;
  currency: string;
  transactions: Transaction[];
}

export default function Finance() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/finance/wallet');
      setData(data);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      setError('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async () => {
    if (!data || data.balance <= 0) return;
    if (!confirm(`Request payout for ${data.currency} ${data.balance.toFixed(2)}?`)) return;
    
    setRequesting(true);
    try {
      await api.post('/admin/finance/payout', { amount: data.balance });
      alert('Payout requested successfully');
      fetchWallet(); // Refresh
    } catch {
      alert('Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-500">Loading finance data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6 text-center">
      <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block mb-4">
        {error}
      </div>
      <div>
        <button 
          onClick={fetchWallet}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Finance & Wallet</h1>
        <button
          onClick={handlePayout}
          disabled={requesting || data.balance <= 0}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Wallet size={18} />
          {requesting ? 'Requesting...' : 'Request Payout'}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ArrowUpRight size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.currency} {data.totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Platform Fees (10%)</h3>
            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
              <ArrowDownLeft size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.currency} {data.commission.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-500">Available Balance</h3>
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {data.currency} {data.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Fee</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Net Earnings</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">#{txn.orderId}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(txn.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {data.currency} {txn.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-red-600">
                    - {data.currency} {txn.fee.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-green-600 font-bold">
                    + {data.currency} {txn.net.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full capitalize">
                      {txn.status}
                    </span>
                  </td>
                </tr>
              ))}
              {data.transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No completed transactions yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
