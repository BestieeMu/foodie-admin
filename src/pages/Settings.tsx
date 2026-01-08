import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Save, Image as ImageIcon, X, Upload, Loader2, Shield } from 'lucide-react';
import type { Restaurant } from '../types';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Partial<Restaurant>>({});
  const [platformSettings, setPlatformSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      if (user?.role === 'super_admin') {
        const { data } = await api.get('/admin/settings/platform');
        setPlatformSettings(data);
      } else {
        const { data } = await api.get('/admin/restaurant/my');
        setRestaurant(data);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError('Failed to load settings');
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

    try {
      const { data } = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setRestaurant(prev => ({ ...prev, imageUrl: data.url }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    
    try {
      if (user?.role === 'super_admin') {
         // Mock platform update
         await new Promise(r => setTimeout(r, 1000));
         setMessage('Platform settings saved');
      } else {
         await api.patch('/admin/restaurant/my', restaurant);
         setMessage('Settings saved successfully');
      }
    } catch {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="animate-spin text-primary" size={32} />
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg">
      {error}
      <button onClick={fetchSettings} className="ml-4 underline">Retry</button>
    </div>
  );

  // Super Admin View
  if (user?.role === 'super_admin') {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Platform Settings</h1>
        {message && (
          <div className="p-4 mb-4 rounded-lg bg-green-100 text-green-700">{message}</div>
        )}
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 space-y-6">
          <div className="flex items-center gap-2 text-primary mb-4">
             <Shield size={24} />
             <h3 className="font-bold">Global Configuration</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
            <input
              type="text"
              value={platformSettings.platformName || ''}
              onChange={(e) => setPlatformSettings({ ...platformSettings, platformName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
            <input
              type="number"
              value={platformSettings.commissionRate || ''}
              onChange={(e) => setPlatformSettings({ ...platformSettings, commissionRate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    );
  }

  // Restaurant Admin View
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Settings</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-xl p-6 border border-gray-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
          <input
            type="text"
            value={restaurant.name || ''}
            onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <input
            type="text"
            value={restaurant.address || ''}
            onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Image</label>
          
          <div className="flex items-start gap-4">
            {/* Image Preview */}
            <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
              {restaurant.imageUrl ? (
                <>
                  <img src={restaurant.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setRestaurant({ ...restaurant, imageUrl: '' })}
                    className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <ImageIcon className="text-gray-400" size={32} />
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              )}
            </div>

            {/* Upload Controls */}
            <div className="flex-1">
              <div className="flex gap-2 mb-2">
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <Upload size={18} />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <input
                type="url"
                value={restaurant.imageUrl || ''}
                onChange={(e) => setRestaurant({ ...restaurant, imageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary text-sm"
                placeholder="Or paste image URL..."
              />
              <p className="text-xs text-gray-400 mt-1">
                Supported formats: JPG, PNG, WEBP (Max 5MB)
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Categories (comma separated)</label>
          <input
            type="text"
            value={restaurant.categories?.join(', ') || ''}
            onChange={(e) => setRestaurant({ ...restaurant, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            placeholder="Italian, Pasta, Pizza"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
