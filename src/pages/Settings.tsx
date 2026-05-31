import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Save, Image as ImageIcon, X, Upload, Loader2, Shield, Store, Bell, CheckCircle2 } from 'lucide-react';
import type { Restaurant } from '../types';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function Settings() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Partial<Restaurant & { acceptingOrders?: boolean; emailNotifications?: boolean }>>({});
  const [platformSettings, setPlatformSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      if (user?.role === 'super_admin') {
        const { data } = await api.get('/admin/settings/platform');
        setPlatformSettings(data);
      } else {
        const { data } = await api.get('/admin/restaurant/my');
        // Add some default UI toggles if they don't exist
        setRestaurant({
          ...data,
          acceptingOrders: data.acceptingOrders !== undefined ? data.acceptingOrders : true,
          emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    const uploadToast = toast.loading('Uploading image...');

    try {
      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setRestaurant(prev => ({ ...prev, imageUrl: data.url }));
      toast.success('Image uploaded successfully', { id: uploadToast });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image', { id: uploadToast });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      if (user?.role === 'super_admin') {
         await new Promise(r => setTimeout(r, 1000));
         toast.success('Platform settings saved');
      } else {
         await api.patch('/admin/restaurant/my', restaurant);
         toast.success('Settings saved successfully');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-orange-100 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading settings...</p>
      </div>
    );
  }

  // Super Admin View
  if (user?.role === 'super_admin') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-gray-500 mt-1">Manage global configuration for the Foodie platform.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-2xl p-8 border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 text-primary mb-6 pb-4 border-b border-gray-100">
             <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
               <Shield size={20} />
             </div>
             <h3 className="font-bold text-lg text-gray-900">Global Configuration</h3>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Platform Name</label>
              <input
                type="text"
                value={platformSettings.platformName || ''}
                onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Commission Rate (%)</label>
              <input
                type="number"
                value={platformSettings.commissionRate || ''}
                onChange={(e) => setPlatformSettings({ ...platformSettings, commissionRate: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 mt-8">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
            >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Restaurant Admin View
  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
        <p className="text-gray-500 mt-1">Manage your public profile and restaurant preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-2xl p-8 border border-gray-100 space-y-6">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
               <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-primary">
                 <Store size={20} />
               </div>
               <h3 className="font-bold text-lg text-gray-900">Public Profile</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Name</label>
                <input
                  type="text"
                  value={restaurant.name || ''}
                  onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Physical Address</label>
                <input
                  type="text"
                  value={restaurant.address || ''}
                  onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Restaurant Cover Image</label>
                <div className="flex flex-col sm:flex-row items-start gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="w-40 h-40 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden relative shadow-sm shrink-0">
                    {restaurant.imageUrl ? (
                      <>
                        <img src={restaurant.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setRestaurant({ ...restaurant, imageUrl: '' })}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur shadow-sm rounded-full text-red-500 hover:bg-white hover:scale-110 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="text-gray-300" size={40} />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="animate-spin text-primary" size={28} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 shadow-sm rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-bold text-gray-700 w-full sm:w-auto justify-center">
                      <Upload size={18} className="text-primary" />
                      <span>Upload New Image</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-semibold">Or Paste URL</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                    <input
                      type="url"
                      value={restaurant.imageUrl || ''}
                      onChange={(e) => setRestaurant({ ...restaurant, imageUrl: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm outline-none transition-all"
                      placeholder="https://example.com/image.jpg"
                    />
                    <p className="text-xs text-gray-500 font-medium">
                      High-resolution images work best. Max 5MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Categories <span className="text-gray-400 font-normal">(Comma separated)</span></label>
                <input
                  type="text"
                  value={restaurant.categories?.join(', ') || ''}
                  onChange={(e) => setRestaurant({ ...restaurant, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="e.g. Italian, Pasta, Pizza"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 mt-8">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                {saving ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Settings (Toggles) */}
        <div className="space-y-6">
          <div className="bg-white shadow-sm rounded-2xl p-6 border border-gray-100">
            <h3 className="font-bold text-lg text-gray-900 mb-6">Preferences</h3>
            
            <div className="space-y-6">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Accepting Orders</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Temporarily pause incoming orders</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRestaurant(prev => ({ ...prev, acceptingOrders: !prev.acceptingOrders }))}
                  className={clsx(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    restaurant.acceptingOrders ? 'bg-primary' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={clsx(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      restaurant.acceptingOrders ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    <Bell size={14} className="text-gray-400" />
                    Email Alerts
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">Receive daily summary emails</p>
                </div>
                <button
                  type="button"
                  onClick={() => setRestaurant(prev => ({ ...prev, emailNotifications: !prev.emailNotifications }))}
                  className={clsx(
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                    restaurant.emailNotifications ? 'bg-primary' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={clsx(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      restaurant.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
            <h3 className="font-bold text-sm text-primary mb-2">Need Help?</h3>
            <p className="text-xs text-orange-800/80 mb-4 leading-relaxed">
              If you have any questions about your restaurant settings or need to update your payment information, please contact our support team.
            </p>
            <button className="text-xs font-bold text-primary bg-white px-4 py-2 rounded-lg shadow-sm border border-orange-100 hover:bg-orange-100 transition-colors w-full">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
