import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import AuthModal from './components/AuthModal';
import OrdersModal from './components/OrdersModal';
import AddProductModal from './components/AddProductModal';
import Toast from './components/Toast';
import { authService, productService, orderService } from './services/api';
import { SlidersHorizontal, Package, Sparkles } from 'lucide-react';

export default function App() {
  // State
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('auracart_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');
  const [loading, setLoading] = useState(true);

  // Modals & UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [orders, setOrders] = useState([]);
  const [toast, setToast] = useState(null);

  // Save Cart to LocalStorage
  useEffect(() => {
    localStorage.setItem('auracart_cart', JSON.stringify(cart));
  }, [cart]);

  // Check stored auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      authService.getProfile()
        .then(userData => {
          setUser(userData);
        })
        .catch(err => {
          console.warn('Auth token expired or invalid:', err);
          localStorage.removeItem('jwt_token');
        });
    }
  }, []);

  // Fetch Categories
  useEffect(() => {
    productService.getCategories()
      .then(setCategories)
      .catch(err => console.error('Categories error:', err));
  }, []);

  // Fetch Products on Filter / Search / Sort Change
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      productService.getProducts({
        category: selectedCategory,
        search: searchQuery,
        sort: sortOption
      })
      .then(setProducts)
      .catch(err => {
        console.error('Products error:', err);
        showToast('Failed to load catalog products', 'error');
      })
      .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchQuery, sortOption]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Cart Operations
  const handleAddToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.id === product.id);
      if (existing) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
    showToast(`Added ${product.name} to cart`);
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item)
    );
  };

  const handleRemoveItem = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    showToast('Item removed from cart', 'info');
  };

  // Auth Operations
  const handleLogin = async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem('jwt_token', data.token);
    setUser(data.user);
    showToast(`Logged in as ${data.user.name}`);
  };

  const handleRegister = async (name, email, password) => {
    const data = await authService.register(name, email, password);
    localStorage.setItem('jwt_token', data.token);
    setUser(data.user);
    showToast(`Account created! Welcome, ${data.user.name}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    showToast('Logged out successfully', 'info');
  };

  // Quick Demo Login Helper
  const handleQuickDemoLogin = async (email, password) => {
    try {
      await handleLogin(email, password);
    } catch (err) {
      showToast(err.message || 'Demo login failed', 'error');
    }
  };

  // Fetch Orders
  const handleOpenOrders = async () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const fetchedOrders = await orderService.getOrders();
      setOrders(fetchedOrders);
      setIsOrdersOpen(true);
    } catch (err) {
      showToast(err.message || 'Failed to load orders', 'error');
    }
  };

  // Checkout Processing
  const handleCheckout = async (cartItems, shippingAddress, totalAmount) => {
    try {
      const orderPayload = {
        items: cartItems.map(i => ({
          product_id: i.id,
          product_name: i.name,
          price: i.price,
          quantity: i.quantity
        })),
        shipping_address: shippingAddress,
        total_amount: totalAmount
      };

      const result = await orderService.createOrder(orderPayload);
      setCart([]);
      setIsCartOpen(false);
      showToast(`Order #${result.orderId} placed successfully!`, 'success');
      
      // Auto open orders view
      handleOpenOrders();
    } catch (err) {
      showToast(err.message || 'Checkout failed', 'error');
    }
  };

  // Add Product (Admin)
  const handleAddProduct = async (productData) => {
    await productService.createProduct(productData);
    showToast('New product added to catalog');
    const refreshed = await productService.getProducts({ category: selectedCategory });
    setProducts(refreshed);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header Navbar */}
      <Navbar 
        user={user}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenOrders={handleOpenOrders}
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        onQuickDemoLogin={handleQuickDemoLogin}
      />

      {/* Main Container */}
      <main style={{ flex: 1, padding: '0 1.5rem 4rem 1.5rem' }}>
        {/* Hero Section */}
        <Hero onExploreClick={() => {
          const el = document.getElementById('catalog-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }} />

        {/* Catalog Section Header & Controls */}
        <div id="catalog-section" style={{ maxWidth: '1300px', margin: '2rem auto 1.5rem auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Explore Catalog</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {products.length} products available {selectedCategory !== 'all' && `in '${selectedCategory}'`}
              </p>
            </div>

            {/* Sorting Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <SlidersHorizontal size={18} color="var(--text-muted)" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid var(--border-glass)',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                <option value="featured" style={{ background: '#0f172a' }}>Sort by: Newest Arrivals</option>
                <option value="price_asc" style={{ background: '#0f172a' }}>Price: Low to High</option>
                <option value="price_desc" style={{ background: '#0f172a' }}>Price: High to Low</option>
                <option value="rating_desc" style={{ background: '#0f172a' }}>Highest Customer Rating</option>
              </select>
            </div>
          </div>

          {/* Category Pill Buttons */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '1rem 0 0.5rem 0' }}>
            <button
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
            >
              All Products
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={selectedCategory === cat.slug ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem', borderRadius: 'var(--radius-full)' }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-muted)' }}>
              <Sparkles size={36} className="gradient-text" style={{ animation: 'spin 2s linear infinite', marginBottom: '1rem' }} />
              <p style={{ fontSize: '1.1rem' }}>Loading Microservices Product Catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-lg)' }}>
              <Package size={48} strokeWidth={1} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No products match your filter criteria</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Try searching for a different term or select another category.</p>
              <button 
                className="btn-secondary" 
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {products.map(product => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  onAddToCart={(p) => handleAddToCart(p, 1)}
                  isInCart={cart.some(item => item.id === product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals & Slide-out Panels */}
      <ProductModal 
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        user={user}
        onCheckout={handleCheckout}
        onOpenAuth={() => {
          setIsCartOpen(false);
          setIsAuthOpen(true);
        }}
      />

      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />

      <OrdersModal 
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
      />

      <AddProductModal 
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={handleAddProduct}
        categories={categories}
      />

      {/* Professional Footer */}
      <footer className="glass-panel" style={{
        borderTop: '1px solid var(--border-glass)',
        padding: '2.5rem 1.5rem',
        marginTop: 'auto',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }} className="gradient-text">AuraCart Microservice Architecture</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '700px' }}>
            Node.js Microservices • Express • MySQL Database Container • JWT RSA Authentication • Dedicated Dockerized React Static SPA • Nginx API Gateway Proxy
          </p>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            &copy; 2026 AuraCart E-Commerce. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
