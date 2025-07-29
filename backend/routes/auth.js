const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Default admin user (in production, this should be in database)
const defaultUsers = [
  {
    id: 1,
    username: 'admin',
    password: '$2a$10$.OLDi5nzx1X.nTGuotENhuxzdRJmiC1YlG0mLgcnKwcS4WUEzXzMO', // password: 'admin123'
    role: 'admin',
    name: 'System Administrator'
  },
  {
    id: 2,
    username: 'officer',
    password: '$2a$10$.OLDi5nzx1X.nTGuotENhuxzdRJmiC1YlG0mLgcnKwcS4WUEzXzMO', // password: 'admin123'
    role: 'officer',
    name: 'Revenue Officer'
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'uvwie-lga-secret-key';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = defaultUsers.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = defaultUsers.find(u => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;