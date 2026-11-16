import app from './app.js';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';

const start = async () => {
  try {
    await connectDB();
    app.listen(env.port, () => console.log(`API running at http://localhost:${env.port}/api`));
  } catch (err) {
    console.error('Không kết nối được MongoDB:', err.message);
    process.exit(1);
  }
};

start();
