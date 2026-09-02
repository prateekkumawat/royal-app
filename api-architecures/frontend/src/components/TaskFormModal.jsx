import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function TaskFormModal({ isOpen, onClose, onSubmit, initialTask }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'BACKLOG',
    priority: 'MEDIUM',
    category: 'General'
  });

  useEffect(() => {
    if (initialTask) {
      setFormData({
        title: initialTask.title || '',
        description: initialTask.description || '',
        status: initialTask.status || 'BACKLOG',
        priority: initialTask.priority || 'MEDIUM',
        category: initialTask.category || 'General'
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        category: 'General'
      });
    }
  }, [initialTask, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    onSubmit(formData);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialTask ? 'Edit Task' : 'Create New Architecture Task'}
          </h2>
          <button onClick={onClose} className="action-btn">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g., Setup Redis Caching Tier"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              maxLength={120}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea 
              className="form-textarea" 
              placeholder="Detailed task description and architectural notes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="BACKLOG">Backlog</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select 
                className="form-select"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g., Security, Frontend, DevOps, API"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
