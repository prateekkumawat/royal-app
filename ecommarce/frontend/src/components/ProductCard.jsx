import React from 'react';
import { Star, ShoppingBag, Eye, Check } from 'lucide-react';

export default function ProductCard({ product, onQuickView, onAddToCart, isInCart }) {
  return (
    <div 
      className="glass-panel"
      style={{
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease'
      }}
    >
      {/* Product Image Container */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '70%', overflow: 'hidden', background: '#0f172a' }}>
        <img 
          src={product.image_url} 
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        />
        
        {/* Rating Badge */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.8rem',
          fontWeight: 600,
          border: '1px solid var(--border-glass)'
        }}>
          <Star size={14} color="#f59e0b" fill="#f59e0b" />
          <span>{parseFloat(product.rating || 4.5).toFixed(1)}</span>
        </div>

        {/* Category Tag */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(99, 102, 241, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '2px 10px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#fff'
        }}>
          {product.category_name || 'Electronics'}
        </div>
      </div>

      {/* Product Info */}
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-main)' }}>
            {product.name}
          </h3>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: '1rem',
            lineHeight: 1.4
          }}>
            {product.description}
          </p>
        </div>

        {/* Price and Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-glass)' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 600 }}>Price</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
              ${parseFloat(product.price).toFixed(2)}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => onQuickView(product)}
              className="btn-secondary"
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}
              title="Quick View"
            >
              <Eye size={18} />
            </button>
            <button 
              onClick={() => onAddToCart(product)}
              className="btn-primary"
              style={{
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-sm)',
                background: isInCart ? 'var(--success)' : 'var(--accent-gradient)'
              }}
            >
              {isInCart ? <Check size={18} /> : <ShoppingBag size={18} />}
              <span style={{ fontSize: '0.85rem' }}>{isInCart ? 'In Cart' : 'Add'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
