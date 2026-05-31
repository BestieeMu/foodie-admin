import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Trash2, MapPin, Edit2, Loader2, Store } from 'lucide-react';
import type { Restaurant } from '../types';

export default function SuperAdminDashboard() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [editingRest, setEditingRest] = useState<Restaurant | null>(null);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = () => {
    setLoading(true);
    api.get('/super/restaurants')
      .then(res => {
        const mapped = res.data.map((r: any) => ({
          ...r,
          imageUrl: r.image_url || r.imageUrl || ''
        }));
        setRestaurants(mapped);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this restaurant?')) return;
    try {
      await api.delete(`/super/restaurants/${id}`);
      setRestaurants(restaurants.filter(r => r.id !== id));
    } catch {
      alert('Failed to delete restaurant');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    const categories = (data.categories as string).split(',').map(s => s.trim()).filter(Boolean);

    try {
      if (editingRest) {
        // Edit Mode
        const res = await api.patch(`/super/restaurants/${editingRest.id}`, {
          name: data.name,
          address: data.address,
          image_url: data.imageUrl,
          categories
        });
        // We might need to map image_url back to imageUrl locally if the backend returns it that way
        const updatedRest = { ...res.data, imageUrl: res.data.image_url || res.data.imageUrl || data.imageUrl };
        setRestaurants(restaurants.map(r => r.id === editingRest.id ? updatedRest : r));
      } else {
        // Create Mode
        await api.post('/super/restaurants', {
          name: data.name,
          address: data.address,
          image_url: data.imageUrl,
          categories,
          email: data.adminEmail,
          password: data.adminPassword,
          adminName: `${data.name} Admin`
        });
        
        fetchRestaurants();
      }

      setIsModalOpen(false);
      setEditingRest(null);
    } catch (err: any) {
      console.error(err);
      alert('Failed to save restaurant: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (rest: Restaurant) => {
    setEditingRest(rest);
    setIsModalOpen(true);
  };

  const openCreate = () => {
    setEditingRest(null);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-orange-100 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading platform data...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        {restaurants.length > 0 && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-all hover:shadow-sm"
          >
            <Plus size={18} />
            New Restaurant
          </button>
        )}
      </div>

      {restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100">
            <Store size={36} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No restaurants yet</h2>
          <p className="text-gray-500 mb-8 max-w-md text-base leading-relaxed">
            Your platform is empty! Get started by onboarding your first restaurant partner to begin accepting orders and generating revenue.
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-orange-600 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Create New Restaurant
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((rest) => (
            <div key={rest.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-100 relative group">
                <img src={rest.imageUrl} alt={rest.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => openEdit(rest)}
                    className="p-2 bg-white rounded-full text-gray-900 hover:text-primary transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{rest.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <MapPin size={14} />
                      {rest.address}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(rest.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {rest.categories.map(cat => (
                    <span key={cat} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingRest ? 'Edit Restaurant' : 'Add New Restaurant'}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input name="name" defaultValue={editingRest?.name} required className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input name="address" defaultValue={editingRest?.address} required className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input name="imageUrl" defaultValue={editingRest?.imageUrl} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                <input name="categories" defaultValue={editingRest?.categories.join(', ')} placeholder="Italian, Pizza" className="w-full px-3 py-2 border rounded-lg" />
              </div>
              
              {!editingRest && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Admin User</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                    <input name="adminEmail" type="email" required className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
                    <input name="adminPassword" type="password" required className="w-full px-3 py-2 border rounded-lg" />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="animate-spin" size={18} />}
                  {editingRest ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
