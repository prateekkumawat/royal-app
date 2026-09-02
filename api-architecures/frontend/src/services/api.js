// API Service module connecting to Spring Boot REST Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Initial fallback mock data if backend connection fails during early setup
const MOCK_TASKS = [
  {
    id: 1,
    title: "Configure CORS Policy",
    description: "Setup cross-origin request policies allowing React frontend to connect seamlessly.",
    status: "COMPLETED",
    priority: "HIGH",
    category: "Security",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Integrate OpenAPI / Swagger UI",
    description: "Auto-generate interactive API documentation endpoints accessible via /swagger-ui.html.",
    status: "COMPLETED",
    priority: "HIGH",
    category: "Documentation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "PostgreSQL Containerization",
    description: "Configure Docker Compose environment variables and volume bindings for persistent database storage.",
    status: "IN_PROGRESS",
    priority: "CRITICAL",
    category: "DevOps",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 4,
    title: "React UI Glassmorphism Theme",
    description: "Design modern visual aesthetic dashboard with live health indicators and responsive task cards.",
    status: "IN_PROGRESS",
    priority: "MEDIUM",
    category: "Frontend",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const checkHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error('Health check non-200 status');
    const data = await res.json();
    return { online: true, data };
  } catch (err) {
    console.warn('Backend API connection check failed. Using fallback mock state:', err.message);
    return { online: false, error: err.message };
  }
};

export const fetchTasks = async (search = '', status = '', category = '') => {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (category) params.append('category', category);

    const url = `${API_BASE_URL}/tasks?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return { data, isMock: false };
  } catch (err) {
    console.warn('Falling back to local data:', err.message);
    let filtered = [...MOCK_TASKS];
    if (search) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(search.toLowerCase()) || 
        t.description.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (status) filtered = filtered.filter(t => t.status === status);
    if (category) filtered = filtered.filter(t => t.category.toLowerCase() === category.toLowerCase());
    return { data: filtered, isMock: true };
  }
};

export const fetchStats = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch (err) {
    return {
      totalTasks: MOCK_TASKS.length,
      backlogCount: MOCK_TASKS.filter(t => t.status === 'BACKLOG').length,
      inProgressCount: MOCK_TASKS.filter(t => t.status === 'IN_PROGRESS').length,
      underReviewCount: MOCK_TASKS.filter(t => t.status === 'UNDER_REVIEW').length,
      completedCount: MOCK_TASKS.filter(t => t.status === 'COMPLETED').length,
      highPriorityCount: MOCK_TASKS.filter(t => t.priority === 'HIGH' || t.priority === 'CRITICAL').length,
      categoryCounts: { Security: 1, Documentation: 1, DevOps: 1, Frontend: 1 }
    };
  }
};

export const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (err) {
    return ['Security', 'Documentation', 'DevOps', 'Frontend', 'Database'];
  }
};

export const createTask = async (taskData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return await res.json();
  } catch (err) {
    const newTask = {
      ...taskData,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    MOCK_TASKS.unshift(newTask);
    return newTask;
  }
};

export const updateTask = async (id, taskData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return await res.json();
  } catch (err) {
    const index = MOCK_TASKS.findIndex(t => t.id === id);
    if (index !== -1) {
      MOCK_TASKS[index] = { ...MOCK_TASKS[index], ...taskData, updatedAt: new Date().toISOString() };
      return MOCK_TASKS[index];
    }
    throw err;
  }
};

export const deleteTask = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return await res.json();
  } catch (err) {
    const index = MOCK_TASKS.findIndex(t => t.id === id);
    if (index !== -1) {
      MOCK_TASKS.splice(index, 1);
    }
    return { deleted: true };
  }
};
