import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./App.css";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "/",
});

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    id: "",
    article: "",
    size: "",
    price: "",
    quantity: "",
  });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [updatingIds, setUpdatingIds] = useState([]);

  // Auto-dismiss messages after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch all articles
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/articles/");
      setProducts(res.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch articles");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Derived list with filter and sorting
  const filteredProducts = useMemo(() => {
    let filtered = products;
    
    // Apply filter
    const q = filter.trim().toLowerCase();
    if (q) {
      filtered = products.filter((p) =>
        String(p.id).includes(q) ||
        p.article?.toLowerCase().includes(q) ||
        p.size?.toLowerCase().includes(q)
      );
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      // Handle numeric fields
      if (sortField === "id" || sortField === "price" || sortField === "quantity") {
        aVal = Number(aVal);
        bVal = Number(bVal);
      } else {
        // Handle string fields
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [products, filter, sortField, sortDirection]);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Reset form
  const resetForm = () => {
    setForm({ id: "", article: "", size: "", price: "", quantity: "" });
    setEditId(null);
    setShowForm(false);
  };

  // Create or update article
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      if (editId) {
        await api.put(`/articles/${editId}/`, {
          article: form.article,
          size: form.size,
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("✓ Article updated successfully");
      } else {
        await api.post("/articles/", {
          article: form.article,
          size: form.size,
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
        setMessage("✓ Article created successfully");
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.detail || "Operation failed");
    }
    setLoading(false);
  };

  // Edit article
  const handleEdit = (product) => {
    setForm({
      id: product.id,
      article: product.article,
      size: product.size,
      price: product.price,
      quantity: product.quantity,
    });
    setEditId(product.id);
    setShowForm(true);
    setMessage("");
    setError("");
  };

  // Delete article
  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this article?");
    if (!ok) return;
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await api.delete(`/articles/${id}/`);
      setMessage("✓ Article deleted successfully");
      fetchProducts();
    } catch (err) {
      setError("Delete failed");
    }
    setLoading(false);
  };

  // Update quantity (increment/decrement)
  const handleChangeQty = async (id, delta) => {
    // mark updating
    setUpdatingIds((s) => [...s, id]);
    const prod = products.find((p) => p.id === id);
    if (!prod) {
      setError("Article not found");
      setUpdatingIds((s) => s.filter((x) => x !== id));
      return;
    }

    const oldQty = Number(prod.quantity || 0);
    const newQty = Math.max(0, oldQty + delta);

    // optimistic update
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: newQty } : p)));
    setMessage("");
    setError("");
    try {
      await api.put(`/articles/${id}/`, {
        article: prod.article,
        size: prod.size,
        price: Number(prod.price),
        quantity: newQty,
      });
      setMessage("✓ Stock updated");
    } catch (err) {
      // revert on error
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: oldQty } : p)));
      setError(err.response?.data?.detail || "Failed to update stock");
    }
    // unmark updating
    setUpdatingIds((s) => s.filter((x) => x !== id));
  };

  const currency = (n) =>
    typeof n === "number" ? n.toFixed(2) : Number(n || 0).toFixed(2);

  // Calculate stats
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const lowStockCount = products.filter(p => p.quantity < 50).length;

  return (
    <div className="app-container">
      {/* Background Logo */}
      <div className="background-logo">
        <img src={`${process.env.PUBLIC_URL}/logo1.svg`} alt="Background Logo" />
      </div>

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <img src={`${process.env.PUBLIC_URL}/logo1.svg`} alt="RAYRED Logo" className="logo" />
          </div>
          <button className="refresh-btn" onClick={fetchProducts} disabled={loading}>
            {loading ? "⟳ Refreshing..." : "⟳ Refresh"}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <p className="stat-label">Total Articles</p>
              <h3 className="stat-value">{products.length}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <p className="stat-label">Inventory Value</p>
              <h3 className="stat-value">₹{currency(totalValue)}</h3>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⚠️</div>
            <div className="stat-info">
              <p className="stat-label">Low Stock Items</p>
              <h3 className="stat-value">{lowStockCount}</h3>
            </div>
          </div>
        </div>

        {/* Search and Action Bar */}
        <div className="search-bar">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search articles by ID, name or size..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <button 
            className="add-btn"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Add Article
          </button>
        </div>

        {/* Messages */}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Form Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => resetForm()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editId ? "Edit Article" : "Add New Article"}</h2>
                <button className="close-btn" onClick={resetForm}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="form-grid">
                {!editId && (
                  <input
                    type="number"
                    name="id"
                    placeholder="Article ID"
                    value={form.id}
                    onChange={handleChange}
                    required
                    className="form-input"
                  />
                )}
                <input
                  type="text"
                  name="article"
                  placeholder="Article Name"
                  value={form.article}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <select
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  required
                  className="form-input"
                >
                  <option value="">Select Size</option>
                  <option value="XS">XS</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                </select>
                <input
                  type="number"
                  name="price"
                  placeholder="Price (₹)"
                  value={form.price}
                  onChange={handleChange}
                  required
                  step="0.01"
                  className="form-input"
                />
                <input
                  type="number"
                  name="quantity"
                  placeholder="Quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  required
                  className="form-input"
                />
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {editId ? "Update Article" : "Create Article"}
                  </button>
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Articles Table */}
        <div className="table-container">
          <div className="table-header">
            <h2>Articles List</h2>
            <span className="result-count">{filteredProducts.length} items</span>
          </div>
          
          {loading && filteredProducts.length === 0 ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading articles...</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="articles-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('id')} className="sortable">
                      ID {sortField === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('article')} className="sortable">
                      Article {sortField === 'article' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Size</th>
                    <th onClick={() => handleSort('price')} className="sortable">
                      Price {sortField === 'price' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => handleSort('quantity')} className="sortable">
                      Stock {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className={p.quantity < 50 ? 'low-stock' : ''}>
                        <td className="id-cell">{p.id}</td>
                        <td className="article-cell">{p.article}</td>
                        <td className="size-cell">{p.size}</td>
                        <td className="price-cell">₹{currency(p.price)}</td>
                        <td>
                          <div className="qty-controls">
                            <button
                              className="qty-btn minus"
                              onClick={() => handleChangeQty(p.id, -1)}
                              disabled={updatingIds.includes(p.id) || Number(p.quantity) <= 0}
                              title="Decrease stock"
                            >
                              {updatingIds.includes(p.id) ? '...' : '−'}
                            </button>

                            <span className={`stock-badge ${p.quantity < 50 ? 'critical' : p.quantity < 100 ? 'warning' : 'healthy'}`}>
                              {p.quantity}
                            </span>

                            <button
                              className="qty-btn plus"
                              onClick={() => handleChangeQty(p.id, 1)}
                              disabled={updatingIds.includes(p.id)}
                              title="Increase stock"
                            >
                              {updatingIds.includes(p.id) ? '...' : '+'}
                            </button>
                          </div>
                        </td>
                        <td className="actions-cell">
                          <button className="btn-icon edit" onClick={() => handleEdit(p)} title="Edit">
                            ✎ Edit
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDelete(p.id)} title="Delete">
                            🗑 Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="empty-state">
                        <p>No articles found</p>
                        <span>Try adjusting your search or add a new article</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
