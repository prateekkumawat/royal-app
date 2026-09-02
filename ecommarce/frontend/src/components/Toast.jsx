import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast, onClose]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 style={{ color: 'var(--success)' }} size={20} />,
    error: <AlertCircle style={{ color: 'var(--danger)' }} size={20} />,
    info: <Info style={{ color: 'var(--accent-primary)' }} size={20} />
  };

  return (
    <div 
      className="animate-fade-in glass-panel"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 20px',
        borderRadius: 'var(--radius-md)',
        borderLeft: `4px solid ${toast.type === 'error' ? 'var(--danger)' : toast.type === 'success' ? 'var(--success)' : 'var(--accent-primary)'}`,
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
      }}
    >
      {icons[toast.type] || icons.info}
      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>{toast.message}</span>
      <button 
        onClick={onClose}
        style={{ background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
