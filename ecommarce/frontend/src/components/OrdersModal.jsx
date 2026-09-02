import React from 'react';
import { X, PackageCheck, Clock, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export default function OrdersModal({ isOpen, onClose, orders }) {
  if (!isOpen) return null;

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
        maxWidth: '750px',
        width: '100%',
        maxHeight: '85vh',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', color: 'var(--text-muted)' }}
        >
          <X size={22} />
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
          <PackageCheck size={26} color="var(--accent-primary)" />
          <div>
            <h2 style={{ fontSize: '1.4rem' }}>Your Order History</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Managed by Order Microservice (MySQL `order_db`)</p>
          </div>
        </div>

        {/* Orders List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingRight: '4px' }}>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', margin: '3rem 0', color: 'var(--text-muted)' }}>
              <PackageCheck size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.4 }} />
              <p style={{ fontSize: '1rem' }}>No orders placed yet.</p>
            </div>
          ) : (
            orders.map(order => (
              <div 
                key={order.id}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem'
                }}
              >
                {/* Order Top Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>Order #{order.id}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Clock size={12} />
                      <span>{new Date(order.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className={`badge ${order.status === 'DELIVERED' ? 'badge-green' : 'badge-indigo'}`}>
                      {order.status}
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                      ${parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {order.items && order.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>{item.quantity}x {item.product_name}</span>
                      <span style={{ color: '#fff', fontWeight: 500 }}>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                  <MapPin size={14} color="var(--accent-primary)" />
                  <span>Ship to: {order.shipping_address}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
