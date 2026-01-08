import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Plus, Edit2, Trash2, Image as ImageIcon, X, Upload, Loader2 } from 'lucide-react';
import type { MenuItem, MenuItemOption, MenuItemOptions } from '../types';

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
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState<MenuFormData>(INITIAL_FORM);
  const [activeTab, setActiveTab] = useState<'basic' | 'sizes' | 'addons' | 'extras'>('basic');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const { data } = await api.get('/admin/menu/my');
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch menu:', error);
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
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.patch(`/admin/menu/item/${editingItem.id}`, formData);
      } else {
        await api.post('/admin/menu/item', formData);
      }
      setIsModalOpen(false);
      fetchMenu();
      resetForm();
    } catch (error) {
      console.error('Failed to save item:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/admin/menu/item/${id}`);
      setItems(items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete item:', error);
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
          className="text-sm text-primary hover:text-orange-700 font-medium flex items-center gap-1"
        >
          <Plus size={16} /> Add {label}
        </button>
      </div>
      {(formData.options[type] || []).map((opt, idx) => (
        <div key={idx} className="flex gap-4 items-start bg-gray-50 p-3 rounded-lg">
          <div className="flex-1">
            <input
              placeholder="Name (e.g. Large)"
              value={opt.name}
              onChange={(e) => updateOption(type, idx, 'name', e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <div className="w-24">
            <input
              type="number"
              placeholder="+Price"
              value={opt.priceDelta}
              onChange={(e) => updateOption(type, idx, 'priceDelta', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => removeOption(type, idx)}
            className="p-2 text-gray-400 hover:text-red-500"
          >
            <X size={18} />
          </button>
        </div>
      ))}
      {(formData.options[type] || []).length === 0 && (
        <p className="text-sm text-gray-500 italic">No {label.toLowerCase()} added yet.</p>
      )}
    </div>
  );

  if (loading) return <div>Loading menu...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus size={18} />
          Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
            <div className="aspect-video bg-gray-100 relative">
              {(item.image || item.imageUrl) ? (
                <img src={item.image || item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => openEdit(item)}
                  className="p-2 bg-white rounded-full text-gray-900 hover:text-primary transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{item.name}</h3>
                  <span className="text-xs font-medium px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                    {item.category}
                  </span>
                </div>
                <span className="font-bold text-primary">${item.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Item' : 'New Item'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('basic')}
              >
                Basic Info
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'sizes' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('sizes')}
              >
                Sizes
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'addons' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('addons')}
              >
                Add-ons
              </button>
              <button
                className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'extras' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('extras')}
              >
                Extras
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              {activeTab === 'basic' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="e.g. Pasta"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Image</label>
                    
                    <div className="flex items-start gap-4">
                      {/* Image Preview */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden relative">
                        {formData.image ? (
                          <>
                            <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, image: '' })}
                              className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-500 hover:bg-white"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <ImageIcon className="text-gray-400" size={24} />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" size={20} />
                          </div>
                        )}
                      </div>

                      {/* Upload Controls */}
                      <div className="flex-1">
                        <div className="flex gap-2 mb-2">
                          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                            <Upload size={16} />
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
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          className="w-full px-3 py-2 border rounded-lg text-sm text-gray-500"
                          placeholder="Or paste image URL..."
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Supported formats: JPG, PNG, WEBP (Max 5MB)
                        </p>
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                type="button"
                className="flex-1 px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-orange-600"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
