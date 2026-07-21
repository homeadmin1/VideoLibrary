import express from 'express';
import cors from 'cors';
import { initDb } from './db';
import { scanLibrary, VIDEO_ROOT } from './scanner';
import videosRouter from './routes/videos';
import categoriesRouter from './routes/categories';
import adminRouter from './routes/admin';
import statsRouter from './routes/stats';
import tagsRouter from './routes/tags';

const PORT = parseInt(process.env.PORT ?? '4000', 10);

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/videos', videosRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stats', statsRouter);
app.use('/api/tags', tagsRouter);

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Video Library API listening on port ${PORT}`);
    console.log(`Video root: ${VIDEO_ROOT}`);
  });

  // Initial scan in the background so startup is not blocked.
  scanLibrary()
    .then((r) =>
      console.log(
        `Initial scan complete: ${r.scanned} files (${r.added} added, ${r.updated} updated, ${r.removed} removed) in ${r.durationMs}ms`
      )
    )
    .catch((err) => console.error('Initial scan failed:', err));
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
