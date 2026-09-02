import React from 'react';
import { Monitor, Server, Database, ShieldAlert, Cpu } from 'lucide-react';

export default function ArchitectureDiagram() {
  const nodes = [
    {
      badge: 'Frontend Tier',
      title: 'React 18 + Vite',
      desc: 'Single Page App served by Nginx (Port 3000). Handles dynamic state & REST requests.',
      icon: Monitor,
      color: '#06b6d4'
    },
    {
      badge: 'Security Layer',
      title: 'Global CORS Filter',
      desc: 'WebMvcConfigurer allowing safe cross-origin resource sharing from React origin.',
      icon: ShieldAlert,
      color: '#8b5cf6'
    },
    {
      badge: 'Backend API Tier',
      title: 'Spring Boot 3 + OpenAPI',
      desc: 'Java 21 REST Controllers, JPA Repositories & Swagger UI on Port 8080.',
      icon: Server,
      color: '#6366f1'
    },
    {
      badge: 'Database Persistence',
      title: 'PostgreSQL 16',
      desc: 'Containerized relational store with persistent volume & Hibernate DDL auto-schema.',
      icon: Database,
      color: '#10b981'
    }
  ];

  return (
    <div className="arch-section">
      <div className="arch-header">
        <h2 className="section-title">
          <Cpu size={20} style={{ color: 'var(--accent-indigo)' }} />
          <span>System Architecture & Data Flow</span>
        </h2>
      </div>

      <div className="arch-flow-grid">
        {nodes.map((n, idx) => {
          const Icon = n.icon;
          return (
            <div key={idx} className="arch-node glass-panel" style={{ borderTop: `3px solid ${n.color}` }}>
              <div className="arch-node-badge" style={{ background: `${n.color}15`, color: n.color }}>
                {n.badge}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon size={18} style={{ color: n.color }} />
                <span className="arch-node-title">{n.title}</span>
              </div>
              <p className="arch-node-desc">{n.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
