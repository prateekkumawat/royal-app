import React from 'react';
import { Cpu, ShieldCheck, Zap, Layers, Database } from 'lucide-react';

export default function Hero({ onExploreClick }) {
  return (
    <div style={{
      maxWidth: '1300px',
      margin: '2rem auto',
      padding: '3rem 2rem',
      borderRadius: 'var(--radius-lg)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid var(--border-glass)'
    }} className="glass-panel">
      {/* Background Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-100px',
        left: '-100px',
        width: '350px',
        height: '350px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem' }}>
        
        {/* Microservice Architecture Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          fontSize: '0.85rem',
          color: '#818cf8',
          fontWeight: 600
        }}>
          <Layers size={16} />
          <span>Multi-Container Microservices • Node.js • Express • MySQL • Docker</span>
        </div>

        <h1 style={{ fontSize: '3rem', lineHeight: 1.15, maxWidth: '850px' }}>
          Discover Premier Tech & Electronics on <span className="gradient-text">AuraCart</span>
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '650px' }}>
          Powered by decoupled microservices, JWT-token protected checkout workflow, and automated Docker orchestration with real-time inventory tracking.
        </p>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
          <button className="btn-primary" onClick={onExploreClick}>
            <Zap size={18} />
            <span>Explore Catalog</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          width: '100%',
          marginTop: '2.5rem'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1.2rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <ShieldCheck color="var(--accent-primary)" size={24} style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>JWT Auth Service</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cryptographically signed token authentication & session security.</p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1.2rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Database color="var(--accent-secondary)" size={24} style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>MySQL Databases</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Independent database schemas for Auth, Catalog, and Orders.</p>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-glass)',
            borderRadius: 'var(--radius-md)',
            padding: '1.2rem',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <Cpu color="#38bdf8" size={24} style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>Nginx API Gateway</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>High-throughput proxying and frontend static asset delivery.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
