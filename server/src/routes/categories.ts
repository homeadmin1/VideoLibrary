import { Router, Request, Response } from 'express';
import { pool } from '../db';

const router = Router();

export interface CategoryNode {
  name: string;
  path: string;
  count: number;
  children: CategoryNode[];
}

/** GET /api/categories — nested tree built from folder structure */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT category_path, COUNT(*)::int AS count
         FROM videos GROUP BY category_path ORDER BY category_path`
    );

    const root: CategoryNode = { name: '', path: '', count: 0, children: [] };
    for (const row of result.rows) {
      root.count += row.count;
      if (!row.category_path) continue;
      const parts: string[] = row.category_path.split('/');
      let node = root;
      let currentPath = '';
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        let child = node.children.find((c) => c.name === part);
        if (!child) {
          child = { name: part, path: currentPath, count: 0, children: [] };
          node.children.push(child);
        }
        child.count += row.count;
        node = child;
      }
    }
    res.json(root);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load categories' });
  }
});

export default router;
