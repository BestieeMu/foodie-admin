import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Upload, Loader2, UtensilsCrossed } from 'lucide-react';
import type { MenuItem, MenuItemOption, MenuItemOptions } from '../types';
import toast from 'react-hot-toast';

interface MenuFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  image: string;
  options: MenuItemOptions;
}

const INITIAL_FORM: MenuFormData = {
  name: '',
  description: '',
  price: '',
  category: '',
  image: '',
  options: { sizes: [], addOns: [], extras: [] }
};

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [restaurantCategories, setRestaurantCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState<'basic' | 'sizes' | 'addons' | 'extras'>('basic');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    setLoading(true);
    try {
      const [menuRes, restRes] = await Promise.all([
        api.get('/admin/menu/my'),
        api.get('/admin/restaurant/my')
      ]);
      setItems(menuRes.data);
      setRestaurantCategories(restRes.data.categories || []);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
      toast.error('Failed to load menu items');
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
      setFormData(prev => ({ ...prev, image: data.url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0
      };
      if (editingItem) {
        await api.patch(`/admin/menu/item/${editingItem.id}`, payload);
        toast.success('Menu item updated');
      } else {
        await api.post('/admin/menu/item', payload);
        toast.success('Menu item created');
      }
      setIsModalOpen(false);
      fetchMenu();
      resetForm();
    } catch (error: any) {
      console.error('Failed to save item:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to save menu item';
      toast.error(`Error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/admin/menu/item/${id}`);
      setItems(items.filter(item => item.id !== id));
      toast.success('Menu item deleted');
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      image: item.image || item.imageUrl || '',
      options: item.options || { sizes: [], addOns: [], extras: [] }
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData(INITIAL_FORM);
    setActiveTab('basic');
  };

  const addOption = (type: keyof MenuItemOptions) => {
    const newOption: MenuItemOption = { id: `opt_${Date.now()}`, name: '', priceDelta: 0 };
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [type]: [...(prev.options[type] || []), newOption]
      }
    }));
  };

  const updateOption = (type: keyof MenuItemOptions, index: number, field: keyof MenuItemOption, value: string | number) => {
    setFormData(prev => {
      const newOptions = [...(prev.options[type] || [])];
      newOptions[index] = { ...newOptions[index], [field]: value };
      return {
        ...prev,
        options: { ...prev.options, [type]: newOptions }
      };
    });
  };

  const removeOption = (type: keyof MenuItemOptions, index: number) => {
    setFormData(prev => {
      const newOptions = [...(prev.options[type] || [])];
      newOptions.splice(index, 1);
      return {
        ...prev,
        options: { ...prev.options, [type]: newOptions }
      };
    });
  };

  const renderOptionList = (type: keyof MenuItemOptions, label: string) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-900">{label}</h3>
        <button
          type="button"
          onClick={() => addOption(type)}
          className="text-sm text-primary hover:text-orange-700 font-medium flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg"
        >
          <Plus size={16} /> Add {label}
        </button>
      </div>
      {(formData.options[type] || []).map((opt, idx) => (
        <div key={idx} className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex-1">
            <input
              placeholder="Name (e.g. Large)"
              value={opt.name}
              onChange={(e) => updateOption(type, idx, 'name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="w-32 relative">
            <input
              type="number"
              placeholder="0.00"
              value={opt.priceDelta}
              onChange={(e) => updateOption(type, idx, 'priceDelta', parseFloat(e.target.value) || 0)}
              className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">+ ₦</span>
          </div>
          <button
            type="button"
            onClick={() => removeOption(type, idx)}
            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      ))}
      {(formData.options[type] || []).length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-sm text-gray-500 font-medium">No {label.toLowerCase()} added yet.</p>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-orange-100 border-t-primary rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading menu...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage your restaurant's food items.</p>
        </div>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all hover:shadow-md hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white border border-gray-200 rounded-2xl shadow-sm min-h-[500px]">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 border border-orange-100">
            <UtensilsCrossed size={36} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Your menu is empty</h2>
          <p className="text-gray-500 mb-8 max-w-md text-base leading-relaxed">
            Start building your restaurant's digital menu by adding your first delicious item!
          </p>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-orange-600 transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Create First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {(item.image || item.imageUrl) ? (
                  <img src={item.image || item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                    <ImageIcon size={40} className="opacity-50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-3 bg-white rounded-full text-gray-900 hover:text-primary transition-colors shadow-lg hover:scale-110"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-3 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors shadow-lg hover:scale-110"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-3 gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{item.name}</h3>
                    <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg">
                      {item.category}
                    </span>
                  </div>
                  <span className="font-extrabold text-primary text-lg bg-orange-50 px-2 py-1 rounded-lg">₦{item.price.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {editingItem ? <Edit2 className="text-primary" size={20} /> : <UtensilsCrossed className="text-primary" size={20} />}
                {editingItem ? 'Edit Menu Item' : 'Create New Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex border-b border-gray-200 px-2 pt-2 bg-gray-50/50">
              {(['basic', 'sizes', 'addons', 'extras'] as const).map((tab) => (
                <button
                  key={tab}
                  className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1).replace('s', 's').replace('ons', '-Ons')}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {activeTab === 'basic' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Item Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                      placeholder="e.g. Classic Cheeseburger"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Base Price (₦)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
                      {restaurantCategories.length > 0 ? (
                        <select
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
                        >
                          <option value="" disabled>Select a category</option>
                          {restaurantCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                          placeholder="e.g. Burgers (Add in Settings)"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none resize-none"
                      rows={3}
                      placeholder="Describe the ingredients and preparation..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Item Image</label>
                    <div className="flex items-start gap-5">
                      <div className="w-28 h-28 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden relative group">
                        {formData.image ? (
                          <>
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, image: '' })}
                                className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="text-gray-300" size={32} />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-primary mb-1" size={20} />
                            <span className="text-[10px] font-bold text-gray-500">UPLOADING</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 pt-1">
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl cursor-pointer transition-colors font-semibold text-sm mb-3">
                          <Upload size={16} className="text-gray-600" />
                          <span>Upload from computer</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={uploading}
                          />
                        </label>
                        <div className="flex items-center gap-3">
                          <div className="h-px bg-gray-200 flex-1"></div>
                          <span className="text-xs font-bold text-gray-400 uppercase">OR URL</span>
                          <div className="h-px bg-gray-200 flex-1"></div>
                        </div>
                        <input
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="w-full mt-3 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-gray-600"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sizes' && renderOptionList('sizes', 'Size Options')}
              {activeTab === 'addons' && renderOptionList('addOns', 'Add-ons')}
              {activeTab === 'extras' && renderOptionList('extras', 'Extras')}
            </form>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              {activeTab === 'extras' ? (
                <button
                  onClick={handleSubmit}
                  type="button"
                  disabled={saving || uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-70"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : null}
                  {saving ? 'Saving...' : 'Save Item'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    const tabs = ['basic', 'sizes', 'addons', 'extras'] as const;
                    const currentIndex = tabs.indexOf(activeTab);
                    setActiveTab(tabs[currentIndex + 1]);
                  }}
                  type="button"
                  disabled={uploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-sm disabled:opacity-70"
                >
                  Next Step
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
