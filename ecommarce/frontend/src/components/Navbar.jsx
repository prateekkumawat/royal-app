import React from 'react';
import { ShoppingBag, Search, User, LogOut, PackageCheck, PlusCircle, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';

export default function Navbar({ 
  user, 
  cartCount, 
  onOpenCart, 
  onOpenAuth, 
  onLogout, 
  onOpenOrders, 
  onOpenAddProduct,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  categories,
  onQuickDemoLogin
}) {
  return (
    <>
      {/* Top Microservices Health & Status Bar */}
      <div style={{
        background: 'linear-gradient(90deg, #090d16 0%, #1e1b4b 50%, #090d16 100%)',
        borderBottom: '1px solid var(--border-glass)',
        padding: '5px 1.5rem',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{
          maxWidth: '1300px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {/* Microservices Health Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: '#a5b4fc' }}>
              <Activity size={13} color="var(--success)" /> Microservices Online:
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
              Auth (JWT :5001)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
              Catalog (:5002)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
              Orders (:5003)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></span>
              MySQL (:3306)
            </span>
          </div>

          {/* Quick Demo Login Switcher */}
          {!user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-dim)' }}>Quick Demo:</span>
              <button 
                onClick={() => onQuickDemoLogin('alex@example.com', 'user123')}
                style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid rgba(99, 102, 241, 0.4)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}
              >
                Customer (Alex)
              </button>
              <button 
                onClick={() => onQuickDemoLogin('admin@ecommerce.com', 'admin123')}
                style={{ background: 'rgba(236, 72, 153, 0.2)', border: '1px solid rgba(236, 72, 153, 0.4)', color: '#f472b6', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}
              >
                Admin (System)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Glass Navigation Bar */}
      <header className="glass-panel" style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid var(--border-glass)',
        padding: '0.85rem 1.5rem'
      }}>
        <div style={{
          maxWidth: '1300px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}>
          {/* Logo Brand */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} 
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
          >
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              animation: 'floatOrb 4s ease-in-out infinite'
            }}>
              <ShoppingBag color="#fff" size={22} />
            </div>
            <div>
              <span style={{ fontSize: '1.45rem', fontWeight: 800, letterSpacing: '-0.03em' }} className="gradient-text">
                AuraCart
              </span>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
                MICROSERVICES • DOCKER
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div style={{
            flex: 1,
            maxWidth: '560px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-full)',
            padding: '4px 14px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search gadgets, laptops, audio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                width: '100%',
                fontSize: '0.9rem',
                padding: '6px 0'
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                paddingRight: '6px'
              }}
            >
              <option value="all" style={{ background: '#0f172a', color: '#fff' }}>All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug} style={{ background: '#0f172a', color: '#fff' }}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {/* Admin Add Product Button */}
            {user && user.role === 'admin' && (
              <button 
                onClick={onOpenAddProduct}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', border: '1px solid rgba(236,72,153,0.4)' }}
                title="Add New Product (Admin)"
              >
                <PlusCircle size={16} color="var(--accent-secondary)" />
                <span>Add Product</span>
              </button>
            )}

            {/* My Orders Button */}
            {user && (
              <button 
                onClick={onOpenOrders}
                className="btn-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
              >
                <PackageCheck size={16} color="var(--accent-primary)" />
                <span>Orders</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button 
              onClick={onOpenCart}
              className="btn-secondary"
              style={{
                position: 'relative',
                padding: '0.55rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid rgba(99, 102, 241, 0.3)'
              }}
            >
              <ShoppingBag size={18} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Cart</span>
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  background: 'var(--accent-secondary)',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 12px rgba(236, 72, 153, 0.6)'
                }}>
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth Action */}
            {user ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-glass)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {user.role === 'admin' ? (
                    <ShieldCheck size={16} color="var(--warning)" />
                  ) : (
                    <User size={16} color="var(--accent-primary)" />
                  )}
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
                  <span className="badge badge-indigo" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>JWT</span>
                </div>
                <button 
                  onClick={onLogout}
                  style={{ background: 'none', color: 'var(--text-muted)', padding: '4px', display: 'flex', alignItems: 'center' }}
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button 
                onClick={onOpenAuth}
                className="btn-primary"
                style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
              >
                <User size={16} />
                <span>Login / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
