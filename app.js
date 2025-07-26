require('dotenv').config();
const express = require('express');
const dbManager = require('./src/database/dbManager');
const webhookRouter = require('./src/api/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for webhook body parsing.
// We need the raw body buffer for signature verification, and the parsed text for XML processing.
const verifyPostData = (req, res, buf) => {
  // Attach the raw buffer to the request object.
  req.rawBody = buf;
};
app.use(express.text({ type: 'application/atom+xml', verify: verifyPostData }));


// Middleware to parse JSON bodies for other potential routes
app.use(express.json());

// Webhook router
app.use('/api/webhook', webhookRouter);

// Default route
app.get('/', (req, res) => {
  res.send('HoloClip Schedule Server is running.');
});

async function startServer() {
  try {
    // Ensure database tables exist on startup
    await dbManager.createTables();
    console.log('Database tables verified/created.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}

startServer();
