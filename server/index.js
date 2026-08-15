const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Update CORS to be more permissive for EC2 connectivity
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock Database
let items = [
    { id: 1, title: 'Learn React', description: 'Master hooks and components', status: 'completed', category: 'Education' },
    { id: 2, title: 'Build Node API', description: 'Create a robust backend with Express', status: 'in-progress', category: 'Work' },
    { id: 3, title: 'Design Premium UI', description: 'Implement glassmorphism and animations', status: 'pending', category: 'Design' }
];

// GET all items
app.get('/api/items', (req, res) => {
    console.log('GET /api/items');
    res.json(items);
});

// POST new item
app.post('/api/items', (req, res) => {
    console.log('POST /api/items', req.body);
    const newItem = {
        id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
        ...req.body
    };
    items.push(newItem);
    res.status(201).json(newItem);
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
    const { id } = req.params;
    const index = items.findIndex(i => i.id === parseInt(id));
    if (index !== -1) {
        items[index] = { ...items[index], ...req.body };
        res.json(items[index]);
    } else {
        res.status(404).json({ message: 'Item not found' });
    }
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
    const { id } = req.params;
    items = items.filter(i => i.id !== parseInt(id));
    res.status(204).send();
});

// Serve built client (if present) to allow hosting without nginx
const path = require('path');
const fs = require('fs');
const clientDist = path.join(__dirname, '..', 'client', 'dist');

if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // Use a regex route to avoid path-to-regexp parsing issues for wildcard routes
    app.get(/.*/, (req, res) => {
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
