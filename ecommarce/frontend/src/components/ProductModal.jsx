import React, { useState } from 'react';
import { X, Star, ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function ProductModal({ product, onClose, onAddToCart }) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

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
        maxWidth: '800px',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.8)',
            color: '#fff',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-glass)'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Image */}
        <div style={{ height: '380px', position: 'relative', background: '#090d16' }}>
          <img 
            src={product.image_url} 
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Product Details */}
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-indigo">{product.category_name || 'Category'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#f59e0b' }}>
                <Star size={14} fill="#f59e0b" />
                <span style={{ fontWeight: 600, color: '#fff' }}>{parseFloat(product.rating || 4.5).toFixed(1)}</span>
              </div>
            </div>

            <h2 style={{ fontSize: '1.6rem', marginBottom: '0.75rem', lineHeight: 1.2 }}>
              {product.name}
            </h2>

            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '1rem' }}>
              ${parseFloat(product.price).toFixed(2)}
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {product.description}
            </p>

            {/* Microservice Info & Trust Badges */}
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={16} color="var(--accent-primary)" />
                <span>Fast Shipping</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--success)" />
                <span>Verified Stock</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={16} color="var(--accent-secondary)" />
                <span>30-Day Guarantee</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-glass)'
            }}>
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ padding: '0.6rem 1rem', background: 'none', color: '#fff', fontSize: '1.1rem' }}
              >
                -
              </button>
              <span style={{ padding: '0 0.5rem', fontWeight: 700, fontSize: '0.95rem' }}>{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                style={{ padding: '0.6rem 1rem', background: 'none', color: '#fff', fontSize: '1.1rem' }}
              >
                +
              </button>
            </div>

            <button 
              onClick={() => {
                onAddToCart(product, quantity);
                onClose();
              }}
              className="btn-primary"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <ShoppingBag size={18} />
              <span>Add to Cart • ${(parseFloat(product.price) * quantity).toFixed(2)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
