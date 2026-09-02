import React from 'react';
import { CheckCircle2, Clock, ListTodo, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function StatsOverview({ stats }) {
  if (!stats) return null;

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.totalTasks || 0,
      footer: 'Across all categories',
      icon: ListTodo,
      accent: 'var(--accent-indigo)'
    },
    {
      title: 'In Progress',
      value: stats.inProgressCount || 0,
      footer: 'Active execution pipeline',
      icon: Clock,
      accent: 'var(--accent-cyan)'
    },
    {
      title: 'Completed',
      value: stats.completedCount || 0,
      footer: 'Verified & deployed',
      icon: CheckCircle2,
      accent: 'var(--accent-emerald)'
    },
    {
      title: 'High / Critical Priority',
      value: stats.highPriorityCount || 0,
      footer: 'Requires immediate focus',
      icon: AlertTriangle,
      accent: 'var(--accent-amber)'
    }
  ];

  return (
    <div className="stats-grid">
      {cards.map((c, i) => {
        const IconComponent = c.icon;
        return (
          <div 
            key={i} 
            className="stat-card glass-panel" 
            style={{ '--card-accent': c.accent }}
          >
            <div className="stat-header">
              <span>{c.title}</span>
              <IconComponent size={18} style={{ color: c.accent }} />
            </div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-footer">{c.footer}</div>
          </div>
        );
      })}
    </div>
  );
}
