import React from 'react';
import { Layers, FileCode2, Plus, RefreshCw } from 'lucide-react';

export default function Header({ isOnline, isMock, onOpenNewTask, onRefresh, swaggerUrl }) {
  return (
    <header className="site-header glass-panel glow-effect">
      <div className="brand-section">
        <div className="brand-icon-wrapper">
          <Layers size={24} />
        </div>
        <div>
          <h1 className="brand-title">API Architecture Studio</h1>
          <p className="brand-subtitle">Spring Boot 3 • PostgreSQL • CORS • React • Docker</p>
        </div>
      </div>

      <div className="header-actions">
        {/* System Health Indicator */}
        <div className="status-pill" title={isOnline ? "Connected to Spring Boot API & PostgreSQL Database" : "Using Fallback Mock State"}>
          <span className={`status-dot ${isOnline ? 'online' : (isMock ? 'mock' : 'offline')}`}></span>
          <span>
            {isOnline ? 'API Connected' : (isMock ? 'Demo Mode (Mock)' : 'API Disconnected')}
          </span>
        </div>

        {/* Swagger UI Link */}
        <a 
          href={swaggerUrl || "http://localhost:8080/swagger-ui.html"} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn btn-swagger"
          title="Open OpenAPI 3 / Swagger UI Documentation"
        >
          <FileCode2 size={16} />
          <span>Swagger UI</span>
        </a>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh} 
          className="btn btn-secondary btn-icon" 
          title="Refresh Data"
        >
          <RefreshCw size={16} />
        </button>

        {/* Create Task Button */}
        <button 
          onClick={onOpenNewTask} 
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
}
