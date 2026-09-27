import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startEscalationScheduler } from './jobs/escalationJob.js';

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_grievance_portal';

const startServer = async () => {
  try {
    // 1. Connect Database
    await connectDB();

    // 2. Initialize App
    const app = createApp(MONGO_URI);

    // 3. Start 24h SLA Escalation Worker
    startEscalationScheduler();

    // 4. Start HTTP Server
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` SMART GRIEVANCE PORTAL SERVER RUNNING`);
      console.log(` Port: ${PORT}`);
      console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      console.log(` API Base: http://localhost:${PORT}/api`);
      console.log(` 24-Hour SLA Job: ACTIVE`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error(`[Server Launch Error]: ${error.message}`);
    process.exit(1);
  }
};

startServer();
