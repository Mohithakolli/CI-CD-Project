import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Tag } from 'lucide-react';

const API_URL = '/api/items';

function App() {
  const [items, setItems] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    category: 'General'
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await axios.get(API_URL);
      // Ensure we always store an array in state. Some environments
      // may wrap the payload (e.g. { items: [...] }) or return
      // a non-array by mistake — guard against that to avoid
      // "items.map is not a function" runtime errors.
      if (Array.isArray(response.data)) {
        setItems(response.data);
      } else if (response.data && Array.isArray(response.data.items)) {
        setItems(response.data.items);
      } else {
        console.warn('Unexpected /api/items response:', response.data);
        setItems([]);
      }
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(API_URL, formData);
      setFormData({ title: '', description: '', status: 'pending', category: 'General' });
      setIsFormOpen(false);
      fetchItems();
    } catch (err) {
      console.error('Error creating item:', err);
    }
  };

  const handleUpdateStatus = async (item) => {
    const nextStatus = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending'
    }[item.status];

    try {
      await axios.put(`${API_URL}/${item.id}`, { status: nextStatus });
      fetchItems();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchItems();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  return (
    <div className="container">
      <header className="flex justify-between" style={{ marginBottom: '3rem', alignItems: 'center' }}>
        <div>
          <h1>DevStack CRM</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your development tasks with ease.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          <Plus size={20} />
          New Task
        </button>
      </header>

      <AnimatePresence>
        {isFormOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass-card"
            style={{ marginBottom: '2rem', overflow: 'hidden' }}
          >
            <form onSubmit={handleSubmit}>
              <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Task title..."
                  />
                </div>
                <div className="input-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="General">General</option>
                    <option value="Work">Work</option>
                    <option value="Education">Education</option>
                    <option value="Design">Design</option>
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What needs to be done?"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary">Create Task</button>
                <button type="button" className="btn btn-danger" onClick={() => setIsFormOpen(false)}>Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid">
        {items.map(item => (
          <motion.div
            layout
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            key={item.id}
            className="glass-card"
          >
            <div className="flex justify-between" style={{ marginBottom: '1rem' }}>
              <span className={`badge badge-${item.status}`}>
                {item.status.replace('-', ' ')}
              </span>
              <div className="flex gap-2">
                {item.status === 'completed' ? <CheckCircle2 size={16} color="var(--success)" /> : <Clock size={16} color="var(--warning)" />}
              </div>
            </div>

            <h3 style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {item.description}
            </p>

            <div className="flex justify-between" style={{ marginTop: 'auto' }}>
              <div className="flex gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                <Tag size={14} />
                {item.category}
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-danger"
                  style={{ padding: '0.5rem' }}
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.5rem' }}
                  onClick={() => handleUpdateStatus(item)}
                >
                  Update
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {items.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          <p>No tasks found. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}

export default App;
