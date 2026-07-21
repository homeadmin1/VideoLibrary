import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { pool } from '../db';
import { VIDEO_ROOT } from '../scanner';

const router = Router();

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.m4v': 'video/x-m4v',
  '.ogv': 'video/ogg'
};

const SORTS: Record<string, string> = {
  recent: 'created_at DESC',
  title: 'title ASC',
  plays: 'play_count DESC, title ASC',
  size: 'size_bytes DESC',
  duration: 'duration_seconds DESC NULLS LAST',
  favorited: 'favorited_at DESC NULLS LAST'
};

/** GET /api/videos — search + filter + paginate */
router.get('/', async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search ?? '').trim();
    const category = String(req.query.category ?? '').trim();
    const tag = String(req.query.tag ?? '').trim();
    const sort = SORTS[String(req.query.sort ?? 'recent')] ?? SORTS.recent;
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(String(req.query.pageSize ?? '24'), 10) || 24));

    const where: string[] = [];
    const params: unknown[] = [];

    if (search) {
      params.push(`%${search}%`);
      const p = `$${params.length}`;
      where.push(
        `(title ILIKE ${p} OR description ILIKE ${p} OR file_name ILIKE ${p}
          OR EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE ${p}))`
      );
    }
    if (category) {
      params.push(category, `${category}/%`);
      where.push(`(category_path = $${params.length - 1} OR category_path LIKE $${params.length})`);
    }
    if (tag) {
      params.push(tag);
      where.push(`$${params.length} = ANY(tags)`);
    }
    if (String(req.query.favorites ?? '') === 'true') {
      where.push('favorite = TRUE');
    }
    if (String(req.query.liked ?? '') === 'true') {
      where.push('liked = TRUE');
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total FROM videos ${whereSql}`,
      params
    );
    const total = countResult.rows[0].total;

    params.push(pageSize, (page - 1) * pageSize);
    const rows = await pool.query(
      `SELECT * FROM videos ${whereSql} ORDER BY ${sort}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    res.json({ total, page, pageSize, items: rows.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list videos' });
  }
});

/** GET /api/videos/:id */
router.get('/:id(\\d+)', async (req: Request, res: Response) => {
  const result = await pool.query('SELECT * FROM videos WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

async function resolveVideoFile(id: string): Promise<{ absPath: string; fileName: string } | null> {
  const result = await pool.query('SELECT file_path, file_name FROM videos WHERE id = $1', [id]);
  if (result.rowCount === 0) return null;
  const root = path.resolve(VIDEO_ROOT);
  const absPath = path.resolve(root, result.rows[0].file_path);
  if (!absPath.startsWith(root + path.sep) && absPath !== root) return null; // path traversal guard
  if (!fs.existsSync(absPath)) return null;
  return { absPath, fileName: result.rows[0].file_name };
}

/** GET /api/videos/:id/stream — HTTP range streaming */
router.get('/:id(\\d+)/stream', async (req: Request, res: Response) => {
  const file = await resolveVideoFile(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });

  const stat = fs.statSync(file.absPath);
  const mime = MIME_TYPES[path.extname(file.absPath).toLowerCase()] ?? 'application/octet-stream';
  const range = req.headers.range;

  if (range) {
    const match = /bytes=(\d*)-(\d*)/.exec(range);
    let start = match && match[1] ? parseInt(match[1], 10) : 0;
    let end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;
    if (isNaN(start) || isNaN(end) || start > end || start >= stat.size) {
      return res.status(416).set('Content-Range', `bytes */${stat.size}`).end();
    }
    end = Math.min(end, stat.size - 1);
    res.status(206).set({
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': mime
    });
    fs.createReadStream(file.absPath, { start, end }).pipe(res);
  } else {
    res.set({
      'Content-Length': stat.size,
      'Content-Type': mime,
      'Accept-Ranges': 'bytes'
    });
    fs.createReadStream(file.absPath).pipe(res);
  }
});

/** GET /api/videos/:id/download */
router.get('/:id(\\d+)/download', async (req: Request, res: Response) => {
  const file = await resolveVideoFile(req.params.id);
  if (!file) return res.status(404).json({ error: 'File not found' });
  await pool.query('UPDATE videos SET download_count = download_count + 1 WHERE id = $1', [
    req.params.id
  ]);
  res.download(file.absPath, file.fileName);
});

/** POST /api/videos/:id/play — register a playback */
router.post('/:id(\\d+)/play', async (req: Request, res: Response) => {
  const result = await pool.query(
    `UPDATE videos SET play_count = play_count + 1, last_played_at = now()
     WHERE id = $1 RETURNING id`,
    [req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  await pool.query('INSERT INTO play_events (video_id) VALUES ($1)', [req.params.id]);
  res.json({ ok: true });
});

/** POST /api/videos/:id/like — toggle like */
router.post('/:id(\\d+)/like', async (req: Request, res: Response) => {
  const result = await pool.query(
    `UPDATE videos SET liked = NOT liked, updated_at = now()
     WHERE id = $1 RETURNING id, liked`,
    [req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

/** POST /api/videos/:id/favorite — toggle favorite */
router.post('/:id(\\d+)/favorite', async (req: Request, res: Response) => {
  const result = await pool.query(
    `UPDATE videos
     SET favorite = NOT favorite,
         favorited_at = CASE WHEN NOT favorite THEN now() ELSE NULL END,
         updated_at = now()
     WHERE id = $1 RETURNING id, favorite, favorited_at`,
    [req.params.id]
  );
  if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
  res.json(result.rows[0]);
});

/** POST /api/videos/favorites/clear — remove all favorites */
router.post('/favorites/clear', async (_req: Request, res: Response) => {
  const result = await pool.query(
    `UPDATE videos SET favorite = FALSE, favorited_at = NULL, updated_at = now()
     WHERE favorite = TRUE`
  );
  res.json({ cleared: result.rowCount ?? 0 });
});

export default router;
