import React, { useState } from 'react';
import { X, PlusCircle, Image, DollarSign, Tag, FileText } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose, onAddProduct, categories }) {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 1);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('20');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onAddProduct({
        category_id: parseInt(categoryId),
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        image_url: imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        maxWidth: '520px',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', color: 'var(--text-muted)' }}
        >
          <X size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
          <PlusCircle size={24} color="var(--accent-secondary)" />
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>Add Product (Admin)</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Inserts record into MySQL `catalog_db`</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Product Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. SonicBoom Portable Speaker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-glass)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{
                  width: '100%',
                  background: '#111827',
                  border: '1px solid var(--border-glass)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Price ($)</label>
              <input 
                type="number" 
                step="0.01"
                required
                placeholder="199.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-glass)',
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Image URL</label>
            <input 
              type="url" 
              required
              placeholder="https://images.unsplash.com/photo-..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-glass)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Description</label>
            <textarea 
              required
              rows={3}
              placeholder="Product description and specifications..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-glass)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '0.9rem',
                resize: 'vertical'
              }}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.8rem' }}
          >
            {loading ? 'Creating...' : 'Publish Product to Catalog'}
          </button>
        </form>
      </div>
    </div>
  );
}
