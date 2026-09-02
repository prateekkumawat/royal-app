import React from 'react';
import { Edit2, Trash2, Tag, Calendar } from 'lucide-react';

export default function TaskCard({ task, onEdit, onDelete, onStatusToggle }) {
  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const getNextStatus = (current) => {
    switch (current) {
      case 'BACKLOG': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'UNDER_REVIEW';
      case 'UNDER_REVIEW': return 'COMPLETED';
      case 'COMPLETED': return 'BACKLOG';
      default: return 'IN_PROGRESS';
    }
  };

  return (
    <div className="task-card glass-panel">
      <div>
        <div className="task-card-header">
          <span className={`badge badge-status-${task.status}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className={`badge badge-priority-${task.priority}`}>
            {task.priority} Priority
          </span>
        </div>

        <h3 className="task-title" style={{ marginTop: 12, marginBottom: 8 }}>
          {task.title}
        </h3>

        <p className="task-description">
          {task.description || 'No description provided.'}
        </p>
      </div>

      <div className="task-card-footer">
        <div className="task-meta">
          {task.category && (
            <span className="task-category">
              #{task.category}
            </span>
          )}
          {task.createdAt && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={13} />
              {formatDate(task.createdAt)}
            </span>
          )}
        </div>

        <div className="task-actions">
          <button 
            onClick={() => onStatusToggle(task.id, getNextStatus(task.status))}
            className="btn btn-secondary"
            style={{ fontSize: '0.72rem', padding: '4px 8px' }}
            title="Advance Task Status"
          >
            Move Next
          </button>
          
          <button 
            onClick={() => onEdit(task)}
            className="action-btn"
            title="Edit Task"
          >
            <Edit2 size={15} />
          </button>
          
          <button 
            onClick={() => onDelete(task.id)}
            className="action-btn delete"
            title="Delete Task"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
