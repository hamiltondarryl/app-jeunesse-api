import { join, resolve, sep } from 'path';

export function uploadsRoot(): string {
  return resolve(process.env.UPLOADS_DIR || join(process.cwd(), 'uploads'));
}

export function isPathInsideUploads(requested: string): boolean {
  const root = uploadsRoot();
  return requested === root || requested.startsWith(`${root}${sep}`);
}
