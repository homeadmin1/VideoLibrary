import { promises as fs } from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { pool } from './db';

export const VIDEO_ROOT =
  process.env.VIDEO_ROOT || path.resolve(__dirname, '..', '..', 'video-library');

const VIDEO_EXTENSIONS = new Set([
  '.mp4', '.webm', '.mov', '.mkv', '.avi', '.m4v', '.ogv'
]);

export interface ScanResult {
  scanned: number;
  added: number;
  updated: number;
  removed: number;
  durationMs: number;
}

interface ProbeInfo {
  duration: number | null;
  width: number | null;
  height: number | null;
}

/** Extract duration/dimensions using ffprobe (bundled in the Docker image). */
function ffprobe(filePath: string): Promise<ProbeInfo> {
  return new Promise((resolve) => {
    const args = [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-show_entries', 'format=duration',
      '-of', 'json',
      filePath
    ];
    const proc = spawn('ffprobe', args);
    let out = '';
    proc.stdout.on('data', (d) => (out += d));
    proc.on('error', () => resolve({ duration: null, width: null, height: null }));
    proc.on('close', () => {
      try {
        const data = JSON.parse(out);
        const stream = data.streams?.[0] ?? {};
        const duration = data.format?.duration ? parseFloat(data.format.duration) : null;
        resolve({
          duration: Number.isFinite(duration) ? duration : null,
          width: stream.width ?? null,
          height: stream.height ?? null
        });
      } catch {
        resolve({ duration: null, width: null, height: null });
      }
    });
  });
}

async function walk(dir: string, files: string[] = []): Promise<string[]> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
      files.push(full);
    }
  }
  return files;
}

function titleFromFileName(fileName: string): string {
  return path
    .parse(fileName)
    .name.replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let scanning = false;

/**
 * Scan the video-library folder, upsert every video found and remove
 * database rows whose files no longer exist on disk.
 */
export async function scanLibrary(): Promise<ScanResult> {
  if (scanning) throw new Error('A scan is already in progress');
  scanning = true;
  const started = Date.now();
  try {
    const absoluteFiles = await walk(VIDEO_ROOT);
    let added = 0;
    let updated = 0;

    const relativePaths: string[] = [];
    for (const absFile of absoluteFiles) {
      const relPath = path.relative(VIDEO_ROOT, absFile).split(path.sep).join('/');
      relativePaths.push(relPath);

      const stat = await fs.stat(absFile);
      const fileName = path.basename(absFile);
      const categoryPath = path.dirname(relPath) === '.' ? '' : path.dirname(relPath);
      const categoryTags = categoryPath ? categoryPath.split('/') : [];

      const existing = await pool.query(
        'SELECT id, size_bytes, file_modified_at, duration_seconds FROM videos WHERE file_path = $1',
        [relPath]
      );

      if (existing.rowCount === 0) {
        const probe = await ffprobe(absFile);
        await pool.query(
          `INSERT INTO videos
             (file_path, file_name, title, tags, category_path, size_bytes,
              duration_seconds, width, height, file_modified_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            relPath,
            fileName,
            titleFromFileName(fileName),
            categoryTags,
            categoryPath,
            stat.size,
            probe.duration,
            probe.width,
            probe.height,
            stat.mtime
          ]
        );
        added++;
      } else {
        const row = existing.rows[0];
        const fileChanged =
          Number(row.size_bytes) !== stat.size ||
          new Date(row.file_modified_at).getTime() !== stat.mtime.getTime();
        if (fileChanged || row.duration_seconds === null) {
          const probe = await ffprobe(absFile);
          await pool.query(
            `UPDATE videos
               SET size_bytes = $2, duration_seconds = COALESCE($3, duration_seconds),
                   width = COALESCE($4, width), height = COALESCE($5, height),
                   category_path = $6, file_modified_at = $7, updated_at = now()
             WHERE id = $1`,
            [row.id, stat.size, probe.duration, probe.width, probe.height, categoryPath, stat.mtime]
          );
          updated++;
        }
      }
    }

    // Remove rows for files that no longer exist.
    const removedResult =
      relativePaths.length > 0
        ? await pool.query('DELETE FROM videos WHERE NOT (file_path = ANY($1))', [relativePaths])
        : await pool.query('DELETE FROM videos');

    return {
      scanned: absoluteFiles.length,
      added,
      updated,
      removed: removedResult.rowCount ?? 0,
      durationMs: Date.now() - started
    };
  } finally {
    scanning = false;
  }
}
