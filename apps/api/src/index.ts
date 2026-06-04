import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { User } from '@insightflow/shared';
import { initDb } from './db/init';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspace';
import dataRoutes from './routes/data';
import queryRoutes from './routes/query';
import mlRoutes from './routes/ml';
import datasetRoutes from './routes/datasets';
import dashboardRoutes from './routes/dashboard';
import orgRoutes from './routes/org';
import { initWebsocket } from './ws';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Initialize Postgres DB
initDb();

// Configure CORS with credentials support for HTTPOnly cookies
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Authentication and Operational routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/datasets', datasetRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/ml', mlRoutes);
app.use('/api/org', orgRoutes);

app.get('/api/health', (req, res) => {
  const dummyUser: User = {
    id: '1',
    email: 'admin@insightflow.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
  };
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: 'InsightFlow Backend API',
    testUser: dummyUser
  });
});

// Initialize WebSocket connection events
initWebsocket(io);

server.listen(port, () => {
  console.log(`InsightFlow API running on port ${port}`);
});
