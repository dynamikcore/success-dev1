const express = require('express');
const cors = require('cors');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Database connection
const sequelize = db.sequelize;

// Import routes
const shopRoutes = require('./routes/shops');
const paymentRoutes = require('./routes/payments');
const permitRoutes = require('./routes/permits');
const reportRoutes = require('./routes/reports');
const revenueTypeRoutes = require('./routes/revenue-types');

// Use routes
app.use('/api/shops', shopRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/permits', permitRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/revenue-types', revenueTypeRoutes);

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// Database sync and server start
sequelize.sync({ force: false })
  .then(() => {
    console.log('Database synced successfully.');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = app;