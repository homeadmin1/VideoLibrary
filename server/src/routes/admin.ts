import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { scanLibrary } from '../scanner';

const router = Router();

/** POST /api/admin/scan — re-scan the video-library folder */
router.post('/scan', async (_req: Request, res: Response) => {
  try {
    const result = await scanLibrary();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(409).json({ error: (err as Error).message });
  }
});

/** PATCH /api/admin/videos/:id — edit metadata */
router.patch('/videos/:id(\\d+)', async (req: Request, res: Response) => {
  try {
    const { title, description, tags } = req.body ?? {};
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      return res.status(400).json({ error: 'Title must be a non-empty string' });
    }
    if (description !== undefined && typeof description !== 'string') {
      return res.status(400).json({ error: 'Description must be a string' });
    }
    if (
      tags !== undefined &&
      (!Array.isArray(tags) || tags.some((t) => typeof t !== 'string'))
    ) {
      return res.status(400).json({ error: 'Tags must be an array of strings' });
    }

    const result = await pool.query(
      `UPDATE videos SET
         title       = COALESCE($2, title),
         description = COALESCE($3, description),
         tags        = COALESCE($4, tags),
         updated_at  = now()
       WHERE id = $1
       RETURNING *`,
      [
        req.params.id,
        title !== undefined ? title.trim() : null,
        description !== undefined ? description : null,
        tags !== undefined ? tags.map((t: string) => t.trim()).filter(Boolean) : null
      ]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

export default router;
