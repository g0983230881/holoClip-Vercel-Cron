console.log('Vercel is attempting to load app.js...'); // <-- Debugging log
require('dotenv').config();
const express = require('express');
const dbManager = require('./src/database/dbManager');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies for other potential routes
app.use(express.json());

// Default route
app.get('/', (req, res) => {
  res.send('HoloClip Schedule Server is running.');
});

// A simple health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});


async function startServer() {
  try {
    // Ensure database tables exist on startup
    await dbManager.createTables();
    console.log('Database tables verified/created.');

    // This part is for local development. On Vercel, it's handled differently.
    if (process.env.NODE_ENV !== 'production') {
      app.listen(PORT, () => {
        console.log(`Legacy server listening on port ${PORT}`);
      });
    }
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}

startServer();

// Export the app for Vercel
module.exports = app;
