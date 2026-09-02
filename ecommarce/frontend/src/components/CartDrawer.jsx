import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  onUpdateQuantity, 
  onRemoveItem, 
  user, 
  onCheckout,
  onOpenAuth
}) {
  const [shippingAddress, setShippingAddress] = useState('742 Evergreen Terrace, Springfield, OR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  const shipping = subtotal > 0 ? (subtotal > 200 ? 0 : 15) : 0;
  const total = subtotal + shipping;

  const handleCheckoutSubmit = async () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (!shippingAddress.trim()) {
      alert('Please provide a valid shipping address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCheckout(cart, shippingAddress, total);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 15, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      <div 
        className="glass-panel animate-slide-right"
        style={{
          maxWidth: '480px',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          borderLeft: '1px solid var(--border-glass)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-glass)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShoppingBag color="var(--accent-primary)" size={22} />
            <h2 style={{ fontSize: '1.3rem' }}>Your Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</h2>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', margin: 'auto 0', color: 'var(--text-muted)' }}>
              <ShoppingBag size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>Your cart is empty</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '4px' }}>Add items from our catalog to get started.</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.id}
                style={{
                  display: 'flex',
                  gap: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  alignItems: 'center'
                }}
              >
                <img 
                  src={item.image_url} 
                  alt={item.name}
                  style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '4px', lineHeight: 1.3 }}>{item.name}</h4>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                    ${parseFloat(item.price).toFixed(2)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <button 
                    onClick={() => onRemoveItem(item.id)}
                    style={{ background: 'none', color: 'var(--danger)', padding: '2px' }}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'rgba(15,23,42,0.8)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-glass)'
                  }}>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      style={{ padding: '2px 8px', background: 'none', color: '#fff' }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 4px' }}>{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      style={{ padding: '2px 8px', background: 'none', color: '#fff' }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Checkout Section */}
        {cart.length > 0 && (
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid var(--border-glass)',
            background: 'rgba(11, 15, 25, 0.95)'
          }}>
            {/* Address Input */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                <MapPin size={14} color="var(--accent-primary)" />
                <span>Shipping Address</span>
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter shipping address"
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Calculations */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Shipping</span>
                <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid var(--border-glass)' }}>
                <span>Total</span>
                <span className="gradient-text">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Order Microservice JWT Notice */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '1rem' }}>
              <ShieldCheck size={14} color="var(--success)" />
              <span>JWT Signed • Order Microservice Proxy Route</span>
            </div>

            <button 
              onClick={handleCheckoutSubmit}
              disabled={isSubmitting}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: '0.85rem' }}
            >
              {isSubmitting ? 'Processing Order...' : (user ? 'Complete Checkout' : 'Login to Checkout')}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
