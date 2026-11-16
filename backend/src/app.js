import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middlewares/errorHandler.js';

const app = express();

app.use(cors({ origin: env.clientUrl }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

// Chế độ production: phục vụ luôn bản build của frontend (frontend/dist)
// -> chỉ cần 1 server, mở http://localhost:3000
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../frontend/dist');
if (env.serveClient && fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback: mọi route không phải /api trả về index.html cho Vue Router
  app.get(/^\/(?!api).*/, (req, res) => res.sendFile(path.join(distDir, 'index.html')));
  console.log(`Serving frontend from ${distDir}`);
}

app.use(notFound);
app.use(errorHandler);

export default app;
