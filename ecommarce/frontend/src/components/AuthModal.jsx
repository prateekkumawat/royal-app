import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Sparkles, Key } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginView) {
        await onLogin(email, password);
      } else {
        await onRegister(name, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setIsLoginView(true);
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
        maxWidth: '440px',
        width: '100%',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '18px', right: '18px', background: 'none', color: 'var(--text-muted)' }}
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'var(--accent-glow)',
            color: 'var(--accent-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            <Lock size={24} />
          </div>
          <h2 style={{ fontSize: '1.5rem' }}>
            {isLoginView ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Authenticated via JWT Auth Microservice
          </p>
        </div>

        {/* View Switch Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-glass)'
        }}>
          <button 
            onClick={() => { setIsLoginView(true); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              background: isLoginView ? 'var(--accent-primary)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsLoginView(false); setError(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: 'var(--radius-sm)',
              background: !isLoginView ? 'var(--accent-primary)' : 'transparent',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            Register
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!isLoginView && (
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  required
                  placeholder="Alex Johnson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--border-glass)',
                    padding: '10px 12px 10px 40px',
                    borderRadius: 'var(--radius-md)',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="email" 
                required
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-glass)',
                  padding: '10px 12px 10px 40px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--border-glass)',
                  padding: '10px 12px 10px 40px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '0.9rem'
                }}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.8rem' }}
          >
            {loading ? 'Authenticating...' : (isLoginView ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Demo Fast Login Shortcuts */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginBottom: '10px' }}>
            ⚡ 1-Click Instant Demo Login:
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => handleDemoFill('alex@example.com', 'user123')}
              className="btn-secondary"
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem', justifyContent: 'center' }}
            >
              <User size={14} color="var(--accent-primary)" />
              <span>Customer Demo</span>
            </button>
            <button 
              onClick={() => handleDemoFill('admin@ecommerce.com', 'admin123')}
              className="btn-secondary"
              style={{ flex: 1, padding: '6px 10px', fontSize: '0.75rem', justifyContent: 'center' }}
            >
              <ShieldCheck size={14} color="var(--warning)" />
              <span>Admin Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
