import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

/** GET /api/tags — distinct tags with usage counts (for the tag cloud + autocomplete). */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT t AS tag, COUNT(*)::int AS count
       FROM videos, unnest(tags) AS t
       GROUP BY t
       ORDER BY count DESC, tag ASC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list tags' });
  }
});

export default router;
