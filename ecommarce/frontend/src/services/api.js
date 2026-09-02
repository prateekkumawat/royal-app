const BASE_URL = '';

function getAuthHeaders() {
    const token = localStorage.getItem('jwt_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const authService = {
    async login(email, password) {
        const res = await fetch(`${BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        return data;
    },

    async register(name, email, password) {
        const res = await fetch(`${BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        return data;
    },

    async getProfile() {
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
            headers: { ...getAuthHeaders() }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch user info');
        return data.user;
    }
};

export const productService = {
    async getCategories() {
        const res = await fetch(`${BASE_URL}/api/categories`);
        if (!res.ok) throw new Error('Failed to fetch categories');
        return res.json();
    },

    async getProducts(params = {}) {
        const query = new URLSearchParams();
        if (params.category && params.category !== 'all') query.append('category', params.category);
        if (params.search) query.append('search', params.search);
        if (params.sort) query.append('sort', params.sort);

        const res = await fetch(`${BASE_URL}/api/products?${query.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch products');
        return res.json();
    },

    async getProductById(id) {
        const res = await fetch(`${BASE_URL}/api/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product details');
        return res.json();
    },

    async createProduct(productData) {
        const res = await fetch(`${BASE_URL}/api/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(productData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create product');
        return data;
    }
};

export const orderService = {
    async createOrder(orderPayload) {
        const res = await fetch(`${BASE_URL}/api/orders/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify(orderPayload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to place order');
        return data;
    },

    async getOrders() {
        const res = await fetch(`${BASE_URL}/api/orders/`, {
            headers: { ...getAuthHeaders() }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch orders');
        return data;
    }
};
