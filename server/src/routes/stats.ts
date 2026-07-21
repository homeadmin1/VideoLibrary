import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

/** GET /api/stats/summary */
router.get('/summary', async (_req: Request, res: Response) => {
  const result = await pool.query(`
    SELECT
      COUNT(*)::int                             AS total_videos,
      COALESCE(SUM(size_bytes), 0)::bigint      AS total_size_bytes,
      COALESCE(SUM(play_count), 0)::int         AS total_plays,
      COALESCE(SUM(download_count), 0)::int     AS total_downloads,
      COALESCE(SUM(duration_seconds), 0)::float AS total_duration_seconds,
      COUNT(DISTINCT category_path)::int        AS total_categories
    FROM videos
  `);
  res.json(result.rows[0]);
});

/** GET /api/stats/top-played?limit=10 */
router.get('/top-played', async (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10));
  const result = await pool.query(
    `SELECT id, title, category_path, play_count, download_count, last_played_at
       FROM videos WHERE play_count > 0
      ORDER BY play_count DESC, last_played_at DESC
      LIMIT $1`,
    [limit]
  );
  res.json(result.rows);
});

/** GET /api/stats/recent?limit=10 — recently added videos */
router.get('/recent', async (req: Request, res: Response) => {
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10));
  const result = await pool.query(
    `SELECT id, title, category_path, size_bytes, created_at
       FROM videos ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  res.json(result.rows);
});

/** GET /api/stats/plays-over-time?days=30 */
router.get('/plays-over-time', async (req: Request, res: Response) => {
  const days = Math.min(365, Math.max(1, parseInt(String(req.query.days ?? '30'), 10) || 30));
  const result = await pool.query(
    `SELECT to_char(d::date, 'YYYY-MM-DD') AS day,
            COALESCE(p.plays, 0)::int AS plays
       FROM generate_series(now() - ($1 || ' days')::interval, now(), '1 day') d
       LEFT JOIN (
         SELECT date_trunc('day', played_at) AS day, COUNT(*) AS plays
           FROM play_events
          WHERE played_at >= now() - ($1 || ' days')::interval
          GROUP BY 1
       ) p ON p.day = date_trunc('day', d)
      ORDER BY d`,
    [days]
  );
  res.json(result.rows);
});

export default router;
