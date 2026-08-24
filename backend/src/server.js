const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const analyzeRoutes = require('./routes/analyzeRoutes');
const momentumRoutes = require('./routes/momentumRoutes');

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.disable('x-powered-by');

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || true,
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;
  res.status(mongoConnected ? 200 : 503).json({
    status: mongoConnected ? 'Operational' : 'Degraded',
    server: 'AuRX Backend',
    database: mongoConnected ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', analyzeRoutes);
app.use('/api', momentumRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
  });
});

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'production' ? undefined : error.message,
  });
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });

  console.log('Connected to MongoDB');

  app.listen(PORT, () => {
    console.log(`AuRX backend running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend:', error.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});
