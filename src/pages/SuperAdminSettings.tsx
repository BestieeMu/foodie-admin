import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Save, Settings as SettingsIcon, DollarSign, Server, AlertCircle } from 'lucide-react';

interface PlatformSettings {
  commissionRate: number;
  taxRate: number;
  currency: string;
  supportEmail: string;
  maintenanceMode: boolean;
}

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/super/settings/platform');
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      await api.patch('/super/settings/platform', settings);
      alert('Settings saved successfully');
    } catch {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-orange-100 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading platform settings...</p>
      </div>
    );
  }
  if (!settings) return <div>Error loading settings</div>;

  return (
    <div className="max-w-3xl pb-24">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-orange-50 rounded-xl border border-orange-100">
          <SettingsIcon size={28} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-500 text-sm mt-1">Manage global configuration, fees, and system states.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Financial Settings Card */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <DollarSign size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Financial Settings</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={settings.commissionRate}
                  onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) })}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Platform fee taken from each completed order.</p>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                  className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Default Currency Code</label>
              <input
                type="text"
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full md:w-1/2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all uppercase"
                maxLength={3}
                placeholder="e.g. NGN, USD"
              />
            </div>
          </div>
        </div>

        {/* System Configuration Card */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
            <Server size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email Address</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full md:w-2/3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="support@foodie.com"
              />
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg transition-colors ${settings.maintenanceMode ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-gray-900">Maintenance Mode</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    When enabled, the customer app and restaurant dashboards will be temporarily disabled.
                  </p>
                </div>
                {/* Custom Toggle */}
                <label className="relative inline-flex items-center cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.maintenanceMode}
                    onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 p-4 px-8 flex justify-end z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <Save size={20} />
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}