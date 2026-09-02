import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import ArchitectureDiagram from './components/ArchitectureDiagram';
import TaskCard from './components/TaskCard';
import TaskFormModal from './components/TaskFormModal';
import { 
  checkHealth, 
  fetchTasks, 
  fetchStats, 
  fetchCategories, 
  createTask, 
  updateTask, 
  deleteTask 
} from './services/api';
import { Search, Filter, Layers, Inbox } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    // Check health
    const health = await checkHealth();
    setIsOnline(health.online);

    // Fetch tasks & stats
    const { data: taskList, isMock: mockFlag } = await fetchTasks(search, statusFilter, categoryFilter);
    setTasks(taskList);
    setIsMock(mockFlag);

    const statsData = await fetchStats();
    setStats(statsData);

    const catList = await fetchCategories();
    setCategories(catList);

    setLoading(false);
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateOrUpdate = async (formData) => {
    if (editingTask) {
      await updateTask(editingTask.id, formData);
    } else {
      await createTask(formData);
    }
    setIsModalOpen(false);
    setEditingTask(null);
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      await deleteTask(id);
      loadData();
    }
  };

  const handleStatusToggle = async (id, newStatus) => {
    const targetTask = tasks.find(t => t.id === id);
    if (targetTask) {
      await updateTask(id, { ...targetTask, status: newStatus });
      loadData();
    }
  };

  const openNewTaskModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditTaskModal = (task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Site Header */}
      <Header 
        isOnline={isOnline} 
        isMock={isMock} 
        onOpenNewTask={openNewTaskModal}
        onRefresh={loadData}
        swaggerUrl="/swagger-ui.html"
      />

      {/* Live System Stats */}
      <StatsOverview stats={stats} />

      {/* System Architecture Diagram */}
      <ArchitectureDiagram />

      {/* Toolbar & Filters */}
      <div className="toolbar-panel glass-panel">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search tasks by title or description..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          
          <select 
            className="select-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="BACKLOG">Backlog</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select 
            className="select-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Task Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading tasks from Spring Boot API...
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state glass-panel">
          <Inbox className="empty-icon" />
          <h3 className="empty-title">No tasks found</h3>
          <p className="empty-desc">
            {search || statusFilter || categoryFilter ? 'Try clearing your search filters.' : 'Get started by creating your first task in the API architecture!'}
          </p>
          <button onClick={openNewTaskModal} className="btn btn-primary">
            Create First Task
          </button>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onEdit={openEditTaskModal}
              onDelete={handleDelete}
              onStatusToggle={handleStatusToggle}
            />
          ))}
        </div>
      )}

      {/* Task Modal */}
      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialTask={editingTask}
      />
    </div>
  );
}
